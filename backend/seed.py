from app import app, db, CelestialObject


# Starting records for the Space Archive.
starting_objects = [
    {
        "name": "Earth",
        "category": "Planet",
        "description": (
            "The third planet from the Sun and the only world currently "
            "known to support life."
        ),
        "distance": "0 miles from Earth",
        "discovered": "Known since ancient times",
    },
    {
        "name": "Mars",
        "category": "Planet",
        "description": (
            "A rocky planet known for its reddish surface, enormous "
            "volcanoes, and signs of ancient water."
        ),
        "distance": "About 140 million miles from Earth on average",
        "discovered": "Known since ancient times",
    },
    {
        "name": "Proxima Centauri",
        "category": "Star",
        "description": (
            "A red dwarf star and the closest known star to the Sun."
        ),
        "distance": "About 4.24 light-years from Earth",
        "discovered": "1915",
    },
    {
        "name": "Orion Nebula",
        "category": "Nebula",
        "description": (
            "A large stellar nursery where new stars are actively forming."
        ),
        "distance": "About 1,344 light-years from Earth",
        "discovered": "Known since ancient times",
    },
    {
        "name": "Andromeda Galaxy",
        "category": "Galaxy",
        "description": (
            "A large spiral galaxy and the nearest major galaxy to the "
            "Milky Way."
        ),
        "distance": "About 2.5 million light-years from Earth",
        "discovered": "Known since ancient times",
    },
]


with app.app_context():
    # Remove all existing records.
    db.session.execute(db.delete(CelestialObject))
    
    # Create a CelestialObject for every dictionary above.
    objects = [
        CelestialObject(
            name=item["name"],
            category=item["category"],
            description=item["description"],
            distance=item["distance"],
            discovered=item["discovered"],
        )
        for item in starting_objects
    ]

    # Add all records and save them.
    db.session.add_all(objects)
    db.session.commit()

    print(f"Added {len(objects)} celestial objects to the database.")