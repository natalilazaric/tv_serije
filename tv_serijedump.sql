--
-- PostgreSQL database dump
--

\restrict jsg3Z0yrxaQ3vjVaduzL2y2Lf6qOkWrZNz7bTKmSaKJ3BdSaZO4h5tasmOU6xhD

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

-- Started on 2025-10-19 13:57:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16520)
-- Name: serija; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.serija (
    id integer NOT NULL,
    naziv character varying(100) NOT NULL,
    zanr character varying(50),
    godina integer,
    prosjecna_ocjena numeric(3,1),
    redatelj character varying(100),
    zemlja character varying(50),
    broj_sezona integer,
    broj_epizoda integer,
    trajanje_ep integer,
    prema_knjizi boolean
);


ALTER TABLE public.serija OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16519)
-- Name: serija_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.serija_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.serija_id_seq OWNER TO postgres;

--
-- TOC entry 4798 (class 0 OID 0)
-- Dependencies: 215
-- Name: serija_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.serija_id_seq OWNED BY public.serija.id;


--
-- TOC entry 218 (class 1259 OID 16527)
-- Name: uloga; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uloga (
    id integer NOT NULL,
    serija_id integer,
    glumac character varying(100) NOT NULL,
    naziv_uloge character varying(100) NOT NULL
);


ALTER TABLE public.uloga OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16526)
-- Name: uloga_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uloga_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uloga_id_seq OWNER TO postgres;

--
-- TOC entry 4799 (class 0 OID 0)
-- Dependencies: 217
-- Name: uloga_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uloga_id_seq OWNED BY public.uloga.id;


--
-- TOC entry 4639 (class 2604 OID 16523)
-- Name: serija id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.serija ALTER COLUMN id SET DEFAULT nextval('public.serija_id_seq'::regclass);


--
-- TOC entry 4640 (class 2604 OID 16530)
-- Name: uloga id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uloga ALTER COLUMN id SET DEFAULT nextval('public.uloga_id_seq'::regclass);


--
-- TOC entry 4790 (class 0 OID 16520)
-- Dependencies: 216
-- Data for Name: serija; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.serija (id, naziv, zanr, godina, prosjecna_ocjena, redatelj, zemlja, broj_sezona, broj_epizoda, trajanje_ep, prema_knjizi) FROM stdin;
1	Prijatelji (Friends)	Komedija	1994	8.9	David Crane, Marta Kauffman	SAD	10	236	22	f
2	Igra prijestolja (Game of Thrones)	Epska fantastika	2011	9.2	David Benioff, D.B Weiss	SAD	8	73	60	t
3	U uredu (The Office)	Komedija	2005	9.0	Greg Daniels	SAD	9	201	22	f
4	Kruna (The Crown)	Drama	2016	8.6	Peter Morgan	UK	6	60	55	f
5	Crno-bijeli svijet (Black & White World)	Drama, Komedija	2015	8.7	Goran Kulenović, Igor Mirković	Hrvatska	4	48	50	f
6	Kuća od papira (La casa de papel)	Kriminalistička drama	2017	8.2	Álex Pina	Španjolska	5	48	60	f
7	Na putu prema dolje (Breaking Bad)	Kriminalistička drama	2008	9.5	Vince Gilligan	SAD	5	62	45	f
8	Sherlock	Kriminalistička drama	2010	9.0	Mark Gatiss	UK	4	13	90	t
9	Tračerica (Gossip Girl)	Drama	2007	7.5	Josh Schwartz, Stephanie Savage	SAD	6	121	42	t
10	Broadchurch	Kriminalistička drama	2013	8.3	Chris Chibnall	UK	3	24	48	f
\.


--
-- TOC entry 4792 (class 0 OID 16527)
-- Dependencies: 218
-- Data for Name: uloga; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uloga (id, serija_id, glumac, naziv_uloge) FROM stdin;
1	1	Jennifer Aniston	Rachel Green
2	1	Matthew Perry	Chandler Bing
3	1	Courteney Cox	Monica Geller
4	2	Kit Harington	Jon Snow
5	2	Peter Dinklage	Tyrion Lannister
6	2	Emilia Clarke	Daenerys Targaryen
7	3	Steve Carell	Michael Scott
8	3	John Krasinski	Jim Halpert
9	3	Jenna Fischer	Pam Beesly
10	4	Claire Foy	Queen Elizabeth II
11	4	Matt Smith	Prince Philip
12	4	Dominic West	Prince Charles
13	5	Filip Riđički	Voljen Kipčić
14	5	Kaja Šišmanović	Una Miličević
15	5	Slavko Sobin	Đermano Kurtela
16	6	Álvaro Morte	Profesor
17	6	Úrsula Corberó	Tokio
18	6	Pedro Alonso	Berlin
19	7	Bryan Cranston	Walter White
20	7	Aaron Paul	Jesse Pinkman
21	7	Anna Gunn	Skyler White
22	8	Benedict Cumberbatch	Sherlock Holmes
23	8	Martin Freeman	Dr. John Watson
24	8	Una Stubbs	Mrs. Hudson
25	9	Penn Badgley	Dan Humphrey
26	9	Blake Lively	Serena van der Woodsen
27	9	Leighton Meester	Blair Waldorf
28	10	Olivia Colman	Ellie Miller
29	10	David Tennant	Alec Hardy
30	10	Jodie Whittaker	Beth Latimer
\.


--
-- TOC entry 4800 (class 0 OID 0)
-- Dependencies: 215
-- Name: serija_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.serija_id_seq', 10, true);


--
-- TOC entry 4801 (class 0 OID 0)
-- Dependencies: 217
-- Name: uloga_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uloga_id_seq', 30, true);


--
-- TOC entry 4642 (class 2606 OID 16525)
-- Name: serija serija_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.serija
    ADD CONSTRAINT serija_pkey PRIMARY KEY (id);


--
-- TOC entry 4644 (class 2606 OID 16532)
-- Name: uloga uloga_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uloga
    ADD CONSTRAINT uloga_pkey PRIMARY KEY (id);


--
-- TOC entry 4645 (class 2606 OID 16533)
-- Name: uloga uloga_serija_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uloga
    ADD CONSTRAINT uloga_serija_id_fkey FOREIGN KEY (serija_id) REFERENCES public.serija(id) ON DELETE CASCADE;


-- Completed on 2025-10-19 13:57:39

--
-- PostgreSQL database dump complete
--

\unrestrict jsg3Z0yrxaQ3vjVaduzL2y2Lf6qOkWrZNz7bTKmSaKJ3BdSaZO4h5tasmOU6xhD

