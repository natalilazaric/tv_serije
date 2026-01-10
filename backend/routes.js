const express = require('express');
const pool = require('./db');
const router = express.Router();
const { Parser } = require('json2csv');

//dohvaćanje prema filteru, atributu, wildcard
router.get('/api/serije', async (req, res) => {
  try {
    const { filter, attribute, format } = req.query;

    let query = `
      SELECT s.*, 
             COALESCE(
               json_agg(json_build_object('glumac', u.glumac, 'uloga', u.naziv_uloge)) 
               FILTER (WHERE u.id IS NOT NULL), '[]'
             ) AS uloge
      FROM serija s
      LEFT JOIN uloga u ON s.id = u.serija_id
    `;

    const values = [];
    if (filter) {
      const likeFilter = `%${filter}%`;
      values.push(likeFilter);

      if (attribute && attribute !== 'all') {
        if (['glumac', 'naziv_uloge'].includes(attribute)) {
          query += ` WHERE EXISTS (
                      SELECT 1 FROM uloga u2
                      WHERE u2.serija_id = s.id AND u2.${attribute} ILIKE $1
                    )`;
        } else if (attribute === 'prema_knjizi') {
          query += ` WHERE (CASE WHEN s.prema_knjizi THEN 'Da' ELSE 'Ne' END) ILIKE $1`;
        } else {
          query += ` WHERE CAST(s.${attribute} AS TEXT) ILIKE $1`;
        }
      } else {
        // wildcard
        query += `
          WHERE s.naziv ILIKE $1
             OR s.zanr ILIKE $1
             OR CAST(s.godina AS TEXT) ILIKE $1
             OR s.redatelj ILIKE $1
             OR s.zemlja ILIKE $1
             OR CAST(s.broj_sezona AS TEXT) ILIKE $1
             OR CAST(s.broj_epizoda AS TEXT) ILIKE $1
             OR CAST(s.trajanje_ep AS TEXT) ILIKE $1
             OR (CASE WHEN s.prema_knjizi THEN 'Da' ELSE 'Ne' END) ILIKE $1
             OR EXISTS (
                 SELECT 1 FROM uloga u2 
                 WHERE u2.serija_id = s.id 
                   AND (u2.glumac ILIKE $1 OR u2.naziv_uloge ILIKE $1)
             )
        `;
      }
    }

    query += ` GROUP BY s.id ORDER BY s.id`;

    const result = await pool.query(query, values);

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(result.rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('serije.csv');
      return res.send(csv);
    }

    if (format === 'json') {
      const jsonLD = result.rows.map(serija => ({
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "@id": `http://localhost:3000/api/serije/${serija.id}`,

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

        "actor": serija.uloge.map(u => ({
          "@type": "Person",
          "name": u.glumac,
          "roleName": u.uloga
        }))
      }));

      res.header('Content-Type', 'application/ld+json');
      return res.json(jsonLD);
    }


    res.json({ response: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvaćanju podataka');
  }
});

//dohvaćanje prema id-u serije
router.get('/api/serije/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT s.*, 
             COALESCE(
               json_agg(json_build_object('glumac', u.glumac, 'uloga', u.naziv_uloge)) 
               FILTER (WHERE u.id IS NOT NULL), '[]'
             ) AS uloge
      FROM serija s
      LEFT JOIN uloga u ON s.id = u.serija_id
      WHERE s.id = $1
      GROUP BY s.id
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serija nije pronađena' });
    }

    res.json({ response: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri dohvaćanju serije' });
  }
});

//dohvaćanje prema godini nastanka serije
router.get('/api/serije/godina/:godina', async (req, res) => {
  try {
    const query = `
      SELECT s.*,
             COALESCE(
               json_agg(json_build_object('glumac', u.glumac, 'uloga', u.naziv_uloge))
               FILTER (WHERE u.id IS NOT NULL), '[]'
             ) AS uloge
      FROM serija s
      LEFT JOIN uloga u ON s.id = u.serija_id
      WHERE s.godina = $1
      GROUP BY s.id
    `;
    const result = await pool.query(query, [req.params.godina]);
    res.json({ response: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri dohvaćanju serija po godini' });
  }
});

//dohvaćanje prema žanru serije
router.get('/api/serije/zanr/:zanr', async (req, res) => {
  try {
    const query = `
      SELECT s.*,
             COALESCE(
               json_agg(json_build_object('glumac', u.glumac, 'uloga', u.naziv_uloge))
               FILTER (WHERE u.id IS NOT NULL), '[]'
             ) AS uloge
      FROM serija s
      LEFT JOIN uloga u ON s.id = u.serija_id
      WHERE s.zanr ILIKE $1
      GROUP BY s.id
    `;
    const result = await pool.query(query, [`%${req.params.zanr}%`]);
    res.json({ response: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri dohvaćanju serija po žanru' });
  }
});

//dohvaćanje prema atributu prema_knjizi
router.get('/api/serije/prema-knjizi/:daNe', async (req, res) => {
  try {
    const value = req.params.daNe.toLowerCase() === 'da';
    const query = `
      SELECT s.*,
             COALESCE(
               json_agg(json_build_object('glumac', u.glumac, 'uloga', u.naziv_uloge))
               FILTER (WHERE u.id IS NOT NULL), '[]'
             ) AS uloge
      FROM serija s
      LEFT JOIN uloga u ON s.id = u.serija_id
      WHERE s.prema_knjizi = $1
      GROUP BY s.id
    `;
    const result = await pool.query(query, [value]);
    res.json({ response: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri dohvaćanju serija prema knjizi' });
  }
});

//dodavanje nove serije
router.post('/api/serije', async (req, res) => {
  const client = await pool.connect();
  try {
    const { naziv, zanr, godina, prosjecna_ocjena, redatelj, zemlja, broj_sezona, broj_epizoda, trajanje_ep, prema_knjizi, uloge = [] } = req.body;
    if (uloge.length > 3) {
      return res.status(400).json({ error: 'Moguće je dodati najviše 3 uloge' });
    }
    await client.query('BEGIN');

    const serijaResult = await client.query(
      `INSERT INTO serija (naziv, zanr, godina, prosjecna_ocjena, redatelj, zemlja, broj_sezona, broj_epizoda, trajanje_ep, prema_knjizi)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [naziv, zanr, godina, prosjecna_ocjena, redatelj, zemlja, broj_sezona, broj_epizoda, trajanje_ep, prema_knjizi]
    );

    const serijaId = serijaResult.rows[0].id;

    for (const uloga of uloge) {
      await client.query(
        `INSERT INTO uloga (serija_id, glumac, naziv_uloge)
         VALUES ($1,$2,$3)`,
        [serijaId, uloga.glumac, uloga.naziv_uloge]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ response: serijaResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Greška pri dodavanju serije i uloga' });
  } finally{
    client.release();
  }
});

//ažuriranje serije prema id-u
router.put('/api/serije/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { uloge, ...updates } = req.body;

    await client.query('BEGIN');
    const setClauses = [];
    const values = [];
    let i = 1;

    for (const key in updates) {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== "") {
        setClauses.push(`${key}=$${i}`);
        values.push(updates[key]);
        i++;
      }
    }

    if (setClauses.length > 0) {
      values.push(id);
      const query = `UPDATE serija SET ${setClauses.join(', ')} WHERE id=$${i} RETURNING *`;
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serija nije pronađena' });
    }
    }

    if (Array.isArray(uloge) && uloge.length > 0) {
      if (uloge.length > 3) {
        throw new Error('Moguće je imati najviše 3 uloge');
      }

      await client.query('DELETE FROM uloga WHERE serija_id = $1', [id]);

      for (const uloga of uloge) {
        await client.query(
          `INSERT INTO uloga (serija_id, glumac, naziv_uloge)
           VALUES ($1,$2,$3)`,
          [id, uloga.glumac, uloga.naziv_uloge]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ response: 'Serija i uloge ažurirane' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


//brisanje određene serije prema id-u
router.delete('/api/serije/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM serija WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serija nije pronađena' });
    }

    res.json({ response: `Serija s ID ${id} je obrisana` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri brisanju serije' });
  }
});


module.exports = router;
