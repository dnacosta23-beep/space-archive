from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)


# Configure the SQLite database.
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///space.db"

# Turns off feature not needed.
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


# Connect SQLAlchemy to the Flask application.
db = SQLAlchemy(app)


# Create the model for our celestial objects.
class CelestialObject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    distance = db.Column(db.String(100), nullable=False)
    discovered = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        """
        Convert a database object into a normal Python dictionary.

        Flask will turn this dictionary into JSON so React can use it.
        """
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "distance": self.distance,
            "discovered": self.discovered,
        }


def validate_object_data(data):
    """
    Check that all required fields were submitted.

    Returns a string containing an error message when something
    is missing. Returns None when the submitted data is valid.
    """
    required_fields = [
        "name",
        "category",
        "description",
        "distance",
        "discovered",
    ]

    for field in required_fields:
        # Make sure the field exists and is not empty.
        if field not in data or not str(data[field]).strip():
            return f"{field.capitalize()} is required."

    return None


@app.route("/")
def home():
    """
    A simple test route.

    Visit http://127.0.0.1:5000 in the browser to confirm
    that the Flask server is running.
    """
    return jsonify(
        {
            "message": "Welcome to the Space Archive API",
            "endpoints": {
                "get_all": "GET /objects",
                "get_one": "GET /objects/<id>",
                "create": "POST /objects",
                "update": "PUT /objects/<id>",
                "delete": "DELETE /objects/<id>",
            },
        }
    )


@app.route("/objects", methods=["GET"])
def get_objects():
    """
    READ all records.

    This route retrieves every celestial object from SQLite.
    """
    objects = db.session.execute(
        db.select(CelestialObject).order_by(CelestialObject.id.desc())
    ).scalars().all()

    return jsonify([space_object.to_dict() for space_object in objects])


@app.route("/objects/<int:object_id>", methods=["GET"])
def get_object(object_id):
    """
    READ one record.

    The object ID comes from the URL.
    Example: GET /objects/3
    """
    space_object = db.session.get(CelestialObject, object_id)

    if space_object is None:
        return jsonify({"error": "Celestial object not found."}), 404

    return jsonify(space_object.to_dict())


@app.route("/objects", methods=["POST"])
def create_object():
    """
    CREATE a new record.

    React sends JSON data to this route.
    The new record is saved in SQLite.
    """
    data = request.get_json(silent=True)

    # Make sure JSON was included in the request.
    if data is None:
        return jsonify({"error": "Request body must contain JSON."}), 400

    validation_error = validate_object_data(data)

    if validation_error:
        return jsonify({"error": validation_error}), 400

    new_object = CelestialObject(
        name=data["name"].strip(),
        category=data["category"].strip(),
        description=data["description"].strip(),
        distance=data["distance"].strip(),
        discovered=data["discovered"].strip(),
    )

    try:
        # Add the new object to the database session.
        db.session.add(new_object)

        # Save the change permanently.
        db.session.commit()

        return jsonify(new_object.to_dict()), 201

    except Exception:
        # Undo the unfinished database change if something fails.
        db.session.rollback()

        return jsonify({"error": "Unable to create celestial object."}), 500


@app.route("/objects/<int:object_id>", methods=["PUT"])
def update_object(object_id):
    """
    UPDATE an existing record.

    React sends the updated information as JSON.
    """
    space_object = db.session.get(CelestialObject, object_id)

    if space_object is None:
        return jsonify({"error": "Celestial object not found."}), 404

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "Request body must contain JSON."}), 400

    validation_error = validate_object_data(data)

    if validation_error:
        return jsonify({"error": validation_error}), 400

    # Replace the old values with the submitted values.
    space_object.name = data["name"].strip()
    space_object.category = data["category"].strip()
    space_object.description = data["description"].strip()
    space_object.distance = data["distance"].strip()
    space_object.discovered = data["discovered"].strip()

    try:
        db.session.commit()

        return jsonify(space_object.to_dict())

    except Exception:
        db.session.rollback()

        return jsonify({"error": "Unable to update celestial object."}), 500


@app.route("/objects/<int:object_id>", methods=["DELETE"])
def delete_object(object_id):
    """
    DELETE an existing record.
    """
    space_object = db.session.get(CelestialObject, object_id)

    if space_object is None:
        return jsonify({"error": "Celestial object not found."}), 404

    try:
        db.session.delete(space_object)
        db.session.commit()

        return jsonify(
            {
                "message": f"{space_object.name} was deleted.",
                "id": object_id,
            }
        )

    except Exception:
        db.session.rollback()

        return jsonify({"error": "Unable to delete celestial object."}), 500


# Create the database table when the application starts.
with app.app_context():
    db.create_all()


# Run Flask when this file is executed directly.
if __name__ == "__main__":
    app.run(debug=True)