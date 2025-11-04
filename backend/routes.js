const express = require('express');
const pool = require('./db');
const router = express.Router();
const { Parser } = require('json2csv');

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
        res.header('Content-Type', 'application/json');
        return res.json(result.rows);
    }

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvaćanju podataka');
  }
});

module.exports = router;
