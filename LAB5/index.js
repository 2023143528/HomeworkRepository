const express = require('express');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const app = express();
const fs = require('fs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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


app.get('/movies/:movie_id', async (req, res) => {
  try {
    const movieId = Number(req.params.movie_id);

    const db = await getDBConnection();
    const movie = await db.get(
      `SELECT movie_id, movie_image, movie_title,
              movie_overview, movie_release_date, movie_rate
       FROM movies WHERE movie_id = ?`,
      movieId
    );
    await db.close();
    if (!movie) {
      return res.status(404).send('영화를 찾을 수 없습니다.');
    }

    const commentsRaw = fs.readFileSync(__dirname + '/public/comments.json', 'utf-8');
    const allComments = JSON.parse(commentsRaw);
    const comments = allComments.filter(c => c.movie_id === movieId);

    let html = fs.readFileSync(__dirname + '/public/movie_detail.html', 'utf-8');

    const movieInfoHTML = `
    <div id="movie-info">
        <div id="movie-info-image">
            <img src="/${movie.movie_image}" alt="${movie.movie_title}" width="200" height="300">
        </div>
        <div id="movie-info-details">
            <p><strong>영화 ID</strong>: ${movie.movie_id}</p>
            <section class="movie-info-title">${movie.movie_title}</section>
            <p><strong>개봉일</strong>: ${movie.movie_release_date}</p>
            <p><strong>평점</strong>: ${movie.movie_rate}</p>
            <p><strong>줄거리</strong>: ${movie.movie_overview}</p>
        </div>
    </div>
    `;

    const commentListHTML = `
    <div id="comments">  
    <section class="movie-info-title">영화 후기</section>
      <ul id="comment-list">
        ${comments.map(c => `<li>${c.text}</li>`).join('\n')}
      </ul>
      <form id="comment-form" method="POST" action="/movies/${movieId}/comments">
        <textarea name="text" placeholder="후기를 남겨주세요"></textarea>
        <button type="submit">등록</button>
      </form>
    </div>
    `;

    html = html
      .replace('<!-- MOVIE_INFO -->', movieInfoHTML)
      .replace('<!-- COMMENT_LIST -->', commentListHTML);

    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  }
});


app.post('/movies/:movie_id/comments', (req, res) => {
  try {
    const movieId = Number(req.params.movie_id);
    const text = req.body.text || '';
    const commentsPath = __dirname + '/public/comments.json';

    const commentsRaw = fs.readFileSync(commentsPath, 'utf-8');
    const comments = JSON.parse(commentsRaw);
    comments.push({ movie_id: movieId, text });

    fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2), 'utf-8');
    res.redirect(`/movies/${movieId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('댓글 저장 실패');
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

