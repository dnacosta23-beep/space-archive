import { useEffect, useState } from 'react'
import './App.css'


// The empty form data is used to reset the form after a successful submission.
const emptyForm = {
  name: '',
  category: 'Planet',
  description: '',
  distance: '',
  discovered: '',
}


function App() {
// React state variables to store the list of celestial objects, form data, and other UI states.
  const [objects, setObjects] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lastDeleted, setLastDeleted] = useState(null)
  const [showSnackbar, setShowSnackbar] = useState(false)
  const [undoing, setUndoing] = useState(false)

  // Read the Flask URL from frontend/.env.
  const API_URL = import.meta.env.VITE_API_URL


  // Retrieve every celestial object from Flask.
  async function fetchObjects() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/objects`)

      if (!response.ok) {
        throw new Error('Unable to load the Space Archive.')
      }

      const data = await response.json()

      setObjects(data)
    } catch (fetchError) {
      console.error(fetchError)
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }


  // Run fetchObjects one time when the page first appears.
  useEffect(() => {
    fetchObjects()
  }, [])

  // Automatically close the delete snackbar after five seconds.
useEffect(() => {
  if (!showSnackbar) {
    return
  }

  const snackbarTimer = setTimeout(() => {
    setShowSnackbar(false)
    setLastDeleted(null)
  }, 5000)

  // Clear the timer if the component updates or the user
  // clicks Undo before the five seconds finish.
  return () => {
    clearTimeout(snackbarTimer)
  }
}, [showSnackbar])


  // Update formData whenever the user types into an input.
  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }


  //Submit either a POST request or a PUT request.
   //POST creates a new object.
   //PUT updates an existing object.
   
  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    setMessage('')
    setError('')


    const isEditing = editingId !== null

    const requestUrl = isEditing
      ? `${API_URL}/objects/${editingId}`
      : `${API_URL}/objects`

    const requestMethod = isEditing ? 'PUT' : 'POST'

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'The request was unsuccessful.')
      }

      if (isEditing) {
        // Replace the old item in React state with the updated item
        // returned by Flask.
        setObjects((currentObjects) =>
          currentObjects.map((spaceObject) =>
            spaceObject.id === editingId ? data : spaceObject
          )
        )

        setMessage(`${data.name} was updated successfully.`)
      } else {
        // Add the newly created object to the beginning of the list.
        setObjects((currentObjects) => [data, ...currentObjects])

        setMessage(`${data.name} was added to the archive.`)
      }

      // Reset the form after a successful request.
      setFormData(emptyForm)
      setEditingId(null)
    } catch (submitError) {
      console.error(submitError)
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

// Fill the form with an existing object's information.
  function beginEditing(spaceObject) {
    setEditingId(spaceObject.id)

    setFormData({
      name: spaceObject.name,
      category: spaceObject.category,
      description: spaceObject.description,
      distance: spaceObject.distance,
      discovered: spaceObject.discovered,
    })

    setMessage('')
    setError('')

    // Move the page back to the form.
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  // Stop editing and return the form to create mode.
  function cancelEditing() {
    setEditingId(null)
    setFormData(emptyForm)
    setMessage('')
    setError('')
  }


  //Delete an object through Flask.
async function handleDelete(spaceObject) {
  const shouldDelete = window.confirm(
    `Are you sure you want to delete ${spaceObject.name}?`
  )

  if (!shouldDelete) {
    return
  }

  setDeletingId(spaceObject.id)
  setMessage('')
  setError('')

  try {
    const response = await fetch(
      `${API_URL}/objects/${spaceObject.id}`,
      {
        method: 'DELETE',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Unable to delete this object.')
    }

    // Save a copy of the deleted object before removing it
    setLastDeleted(spaceObject)

    // Remove the deleted object from the displayed list.
    setObjects((currentObjects) =>
      currentObjects.filter(
        (currentObject) => currentObject.id !== spaceObject.id
      )
    )

    // If the deleted object was currently being edited, reset the form.
    if (editingId === spaceObject.id) {
      setEditingId(null)
      setFormData(emptyForm)
    }

    // Show the snackbar containing the Undo button.
    setShowSnackbar(true)
  } catch (deleteError) {
    console.error(deleteError)
    setError(deleteError.message)
  } finally {
    setDeletingId(null)
  }
}


// Recreate the most recently deleted object.
 // The original database record was already deleted, so this sends a new POST request to Flask. 
 // SQLite will give the restored object a new ID.

async function handleUndoDelete() {
  // Stop if there is no saved object to restore.
  if (!lastDeleted) {
    return
  }

  setUndoing(true)
  setError('')

  try {
    const restoredObjectData = {
      name: lastDeleted.name,
      category: lastDeleted.category,
      description: lastDeleted.description,
      distance: lastDeleted.distance,
      discovered: lastDeleted.discovered,
    }

    const response = await fetch(`${API_URL}/objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restoredObjectData),
    })

    const restoredObject = await response.json()

    if (!response.ok) {
      throw new Error(
        restoredObject.error || 'Unable to restore this object.'
      )
    }

    // Add the restored object back to the beginning of the list.
    // Use the object returned by Flask because it contains the new database ID.
    setObjects((currentObjects) => [
      restoredObject,
      ...currentObjects,
    ])

    setMessage(`${restoredObject.name} was restored.`)

    // Clear the saved deleted object and close the snackbar.
    setLastDeleted(null)
    setShowSnackbar(false)
  } catch (undoError) {
    console.error(undoError)
    setError(undoError.message)
  } finally {
    setUndoing(false)
  }
}

// Close the snackbar without restoring the object.
function closeSnackbar() {
  setShowSnackbar(false)
  setLastDeleted(null)
}

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">LOCAL SPACE DATABASE</p>

        <h1>Space Archive</h1>

        <p className="hero-description">
          Record planets, stars, galaxies, nebulae, constellations,
          solar systems, and other celestial discoveries.
        </p>
      </header>

      <main className="main-content">
        <section className="form-section">
          <div className="section-heading">
            <div>
              <p className="section-label">
                {editingId ? 'UPDATE RECORD' : 'CREATE RECORD'}
              </p>

              <h2>
                {editingId
                  ? 'Edit Celestial Object'
                  : 'Add a Celestial Object'}
              </h2>
            </div>

            {editingId && (
              <button
                className="cancel-button"
                type="button"
                onClick={cancelEditing}
              >
                Cancel Editing
              </button>
            )}
          </div>

          <form className="space-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Object Name</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Example: Saturn"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="Planet">Planet</option>
                  <option value="Dwarf Planet">Dwarf Planet</option>
                  <option value="Moon">Moon</option>
                  <option value="Star">Star</option>
                  <option value="Solar System">Solar System</option>
                  <option value="Galaxy">Galaxy</option>
                  <option value="Nebula">Nebula</option>
                  <option value="Constellation">Constellation</option>
                  <option value="Star Cluster">Star Cluster</option>
                  <option value="Black Hole">Black Hole</option>
                  <option value="Comet">Comet</option>
                  <option value="Asteroid">Asteroid</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="distance">Distance from Earth</label>

                <input
                  id="distance"
                  name="distance"
                  type="text"
                  value={formData.distance}
                  onChange={handleChange}
                  placeholder="Example: 4.24 light-years"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="discovered">Discovered</label>

                <input
                  id="discovered"
                  name="discovered"
                  type="text"
                  value={formData.discovered}
                  onChange={handleChange}
                  placeholder="Example: 1915"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this celestial object..."
                rows="5"
                required
              />
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : 'Add to Archive'}
            </button>
          </form>

          {message && (
            <p className="status-message success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="status-message error-message">
              {error}
            </p>
          )}
        </section>

        <section className="archive-section">
          <div className="archive-heading">
            <div>
              <p className="section-label">READ RECORDS</p>
              <h2>Celestial Objects</h2>
            </div>

            <p className="record-count">
              {objects.length}{' '}
              {objects.length === 1 ? 'record' : 'records'}
            </p>
          </div>

          {loading ? (
            <p className="empty-message">Loading the archive...</p>
          ) : objects.length === 0 ? (
            <p className="empty-message">
              The archive is empty. Add your first celestial object above.
            </p>
          ) : (
            <div className="card-grid">
              {objects.map((spaceObject) => (
                <article
                  className="space-card"
                  key={spaceObject.id}
                >
                  <div className="card-top">
                    <span className="category-badge">
                      {spaceObject.category}
                    </span>

                    <span className="record-id">
                      Record #{spaceObject.id}
                    </span>
                  </div>

                  <h3>{spaceObject.name}</h3>

                  <p className="description">
                    {spaceObject.description}
                  </p>

                  <dl className="details-list">
                    <div>
                      <dt>Distance</dt>
                      <dd>{spaceObject.distance}</dd>
                    </div>

                    <div>
                      <dt>Discovered</dt>
                      <dd>{spaceObject.discovered}</dd>
                    </div>
                  </dl>

                  <div className="card-actions">
                    <button
                      className="edit-button"
                      type="button"
                      onClick={() => beginEditing(spaceObject)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => handleDelete(spaceObject)}
                      disabled={deletingId === spaceObject.id}
                    >
                      {deletingId === spaceObject.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
            </main>

      {showSnackbar && lastDeleted && (
        <div className="snackbar" role="status">
          <p>
            <strong>{lastDeleted.name}</strong> was deleted.
          </p>

          <div className="snackbar-actions">
            <button
              className="undo-button"
              type="button"
              onClick={handleUndoDelete}
              disabled={undoing}
            >
              {undoing ? 'Restoring...' : 'Undo'}
            </button>

            <button
              className="close-snackbar-button"
              type="button"
              onClick={closeSnackbar}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App