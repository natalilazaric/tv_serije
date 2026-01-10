require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const routes = require('./routes');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/data', express.static(path.join(__dirname, 'data')));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

async function getAllDataFromDB() {
  try {
    const serijeRes = await pool.query('SELECT * FROM serija');
    const ulogeRes = await pool.query('SELECT * FROM uloga');

    const serije = serijeRes.rows.map(serija => {
      const uloge = ulogeRes.rows
        .filter(u => u.serija_id === serija.id)
        .map(u => ({ glumac: u.glumac, naziv_uloge: u.naziv_uloge }));

      return {
        ...serija,
        uloge: uloge
      };
    });

    return serije;
  } catch (err) {
    console.error('Greška prilikom dohvaćanja podataka iz baze:', err);
    throw err;
  }
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: process.env.AUTH0_CALLBACK_URL,
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
      return done(null, profile);
    }
  )
);


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get('/login', passport.authenticate('auth0', { scope: 'openid email profile' }));

app.get(
  '/callback',
  passport.authenticate('auth0', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      const returnTo = encodeURIComponent('http://localhost:3000/');
      const clientID = process.env.AUTH0_CLIENT_ID;
      res.redirect(`https://${process.env.AUTH0_DOMAIN}/v2/logout?returnTo=${returnTo}&client_id=${clientID}`);
    });
  });
});


app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.send(req.user);
});

app.get('/profile-page', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.send(`
    <h1>Korisnički profil</h1>
    <p><strong>Ime:</strong> ${user.displayName || user.nickname}</p>
    <p><strong>Email:</strong> ${user.emails ? user.emails[0].value : 'N/A'}</p>
    <p><strong>Auth0 ID:</strong> ${user.id}</p>
    <a href="/">Povratak na početnu</a>
  `);
});

app.get('/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    const data = await getAllDataFromDB();

    // Spremi JSON
    //fs.writeFileSync(path.join(__dirname, 'data/tv_serije.json'), JSON.stringify(data, null, 2));
    
    const jsonLD = data.map(serija => ({
      "@context": "https://schema.org",
      "@type": "TVSeries",
      "name": serija.naziv,            
      "genre": serija.zanr,
      "startDate": serija.godina,
      "director": {                    
        "@type": "Person",
        "name": serija.redatelj
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": serija.prosjecna_ocjena
      },
      "numberOfSeasons": serija.broj_sezona,
      "numberOfEpisodes": serija.broj_epizoda,
      "actors": serija.uloge.map(u => ({
        "@type": "Person",
        "name": u.glumac,
        "roleName": u.naziv_uloge
      }))
    }));
    fs.writeFileSync(
      path.join(__dirname, 'data/tv_serije.json'),
      JSON.stringify(jsonLD, null, 2)
    );

    let csv = 'id,naziv,zanr,godina,prosjecna_ocjena,redatelj,zemlja,broj_sezona,broj_epizoda,trajanje_ep,prema_knjizi,glumac,naziv_uloge\n';

    data.forEach(s => {
      if (s.uloge.length > 0) {
        s.uloge.forEach(u => {
          csv += `${s.id},` +
                `"${s.naziv}",` +
                `"${s.zanr}",` +
                `${s.godina},` +
                `${s.prosjecna_ocjena || ''},` +
                `"${s.redatelj}",` +
                `"${s.zemlja}",` +
                `${s.broj_sezona || ''},` +
                `${s.broj_epizoda || ''},` +
                `${s.trajanje_ep || ''},` +
                `${s.prema_knjizi || false},` +
                `"${u.glumac}",` +
                `"${u.naziv_uloge}"\n`;
        });
      } else {
        csv += `${s.id},` +
              `"${s.naziv}",` +
              `"${s.zanr}",` +
              `${s.godina},` +
              `${s.prosjecna_ocjena || ''},` +
              `"${s.redatelj}",` +
              `"${s.zemlja}",` +
              `${s.broj_sezona || ''},` +
              `${s.broj_epizoda || ''},` +
              `${s.trajanje_ep || ''},` +
              `${s.prema_knjizi || false},` +
              `,""\n`;
      }
    });

    // Spremi CSV
    fs.writeFileSync(path.join(__dirname, 'data/tv_serije.csv'), csv);

    res.send('Preslike baze su osvježene i spremljene.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri osvježavanju preslika.');
  }
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(routes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});
