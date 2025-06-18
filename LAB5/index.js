const express = require('express');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const app = express();

async function getDBConnection() {
    const db = await sqlite.open({
        filename: 'product.db',
        driver: sqlite3.Database
    });
    return db;
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});

app.get('/api/movies', async (req, res) => {
    try {
        const { q } = req.query;
        const sortOption = req.query.sortOption;
        let sort_by;
        if (sortOption === 'rating_desc') {
            sort_by = 'movie_rate DESC';
        } else if (sortOption === 'rating_asc') {
            sort_by = 'movie_rate ASC';
        } else if (sortOption === 'open_desc') {
            sort_by = 'movie_release_date DESC';
        } else if (sortOption === 'open_asc') {
            sort_by = 'movie_release_date ASC';
        } else {
            sort_by = 'movie_rate DESC';
        }
        let sql = 'SELECT * FROM movies';
        const params = [];
        if (q) {
            //sql += ' WHERE movie_title LIKE ? OR movie_overview LIKE ?';
            //params.push(`%${q}%`, `%${q}%`);
            sql += ' WHERE movie_title LIKE ?';
            params.push(`%${q}%`);
        }
        sql += ` ORDER BY ${sort_by}`;
        const db = await getDBConnection();
        const movies = await db.all(sql, params);
        await db.close();
        res.json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});


app.get('/api/movies/:movie_id', async (req, res) => {
  try {
    const db = await getDBConnection();
    const { movie_id } = req.params;
    const movie = await db.get(
      `SELECT movie_id, movie_image, movie_title,
              movie_overview, movie_release_date, movie_rate
       FROM movies
       WHERE movie_id = ?`,
       movie_id
    );
    await db.close();
    if (!movie) return res.status(404).json({ error: 'Not found' });
    res.json(movie);
  } catch (err) {
    console.log(err);
  }
});


app.get('/movies/:movie_id', (req, res) => {
  res.sendFile(__dirname + '/public/movie_detail.html');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

