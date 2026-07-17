# Space Archive

Space Archive is a full CRUD application built with React, Flask, and SQLite.

## What Data the App Manages

The app stores information about celestial objects, including:

- Planets
- Stars
- Galaxies
- Nebulae
- Solar systems
- Constellations
- Moons
- Comets
- Other space objects

Each record contains:

- Name
- Category
- Description
- Distance from Earth
- Discovery information

Users can create, view, update, and delete records.

## Run the Backend

Open a terminal and move into the backend folder:

```bash
cd backend
````

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Install the required packages if needed:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python3 app.py
```

The backend will run at:

```text
http://127.0.0.1:5000
```

## Run the Frontend

Open a second terminal and move into the frontend folder:

```bash
cd frontend
```

Install the frontend packages if needed:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Open the local address shown in the terminal, usually:

```text
http://localhost:5173
```

The Flask backend and React frontend must both be running at the same time.

```
```
