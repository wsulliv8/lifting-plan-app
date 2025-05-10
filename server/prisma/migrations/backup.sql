--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)

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
-- Name: BaseLifts; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."BaseLifts" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    video_url text,
    muscle_group text NOT NULL,
    lift_type text NOT NULL,
    equipment text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BaseLifts" OWNER TO will;

--
-- Name: BaseLifts_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."BaseLifts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BaseLifts_id_seq" OWNER TO will;

--
-- Name: BaseLifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."BaseLifts_id_seq" OWNED BY public."BaseLifts".id;


--
-- Name: Lifts; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."Lifts" (
    id integer NOT NULL,
    workout_id integer NOT NULL,
    base_lift_id integer NOT NULL,
    name text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    sets integer NOT NULL,
    reps text[],
    reps_achieved integer[],
    weight integer[],
    weight_achieved integer[],
    rpe text[],
    rpe_achieved integer[],
    rest_time integer[],
    volume integer,
    progression_rule text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Lifts" OWNER TO will;

--
-- Name: Lifts_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."Lifts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Lifts_id_seq" OWNER TO will;

--
-- Name: Lifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."Lifts_id_seq" OWNED BY public."Lifts".id;


--
-- Name: Plans; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."Plans" (
    id integer NOT NULL,
    user_id integer,
    name text NOT NULL,
    categories text[],
    description text,
    duration_weeks integer NOT NULL,
    difficulty text NOT NULL,
    goal text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Plans" OWNER TO will;

--
-- Name: Plans_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."Plans_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Plans_id_seq" OWNER TO will;

--
-- Name: Plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."Plans_id_seq" OWNED BY public."Plans".id;


--
-- Name: SupersetLinks; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."SupersetLinks" (
    id integer NOT NULL,
    lift_id integer NOT NULL,
    superset_lift_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SupersetLinks" OWNER TO will;

--
-- Name: SupersetLinks_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."SupersetLinks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SupersetLinks_id_seq" OWNER TO will;

--
-- Name: SupersetLinks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."SupersetLinks_id_seq" OWNED BY public."SupersetLinks".id;


--
-- Name: UserLiftsData; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."UserLiftsData" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    base_lift_id integer NOT NULL,
    max_weights integer[],
    rep_ranges integer[],
    max_estimated integer[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserLiftsData" OWNER TO will;

--
-- Name: UserLiftsData_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."UserLiftsData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserLiftsData_id_seq" OWNER TO will;

--
-- Name: UserLiftsData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."UserLiftsData_id_seq" OWNED BY public."UserLiftsData".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Users" OWNER TO will;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_id_seq" OWNER TO will;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: Workouts; Type: TABLE; Schema: public; Owner: will
--

CREATE TABLE public."Workouts" (
    id integer NOT NULL,
    user_id integer,
    plan_id integer,
    name text NOT NULL,
    week_number integer NOT NULL,
    plan_day integer NOT NULL,
    day_of_week text NOT NULL,
    iteration integer,
    total_volume integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Workouts" OWNER TO will;

--
-- Name: Workouts_id_seq; Type: SEQUENCE; Schema: public; Owner: will
--

CREATE SEQUENCE public."Workouts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Workouts_id_seq" OWNER TO will;

--
-- Name: Workouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: will
--

ALTER SEQUENCE public."Workouts_id_seq" OWNED BY public."Workouts".id;


--
-- Name: BaseLifts id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."BaseLifts" ALTER COLUMN id SET DEFAULT nextval('public."BaseLifts_id_seq"'::regclass);


--
-- Name: Lifts id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Lifts" ALTER COLUMN id SET DEFAULT nextval('public."Lifts_id_seq"'::regclass);


--
-- Name: Plans id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Plans" ALTER COLUMN id SET DEFAULT nextval('public."Plans_id_seq"'::regclass);


--
-- Name: SupersetLinks id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."SupersetLinks" ALTER COLUMN id SET DEFAULT nextval('public."SupersetLinks_id_seq"'::regclass);


--
-- Name: UserLiftsData id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."UserLiftsData" ALTER COLUMN id SET DEFAULT nextval('public."UserLiftsData_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: Workouts id; Type: DEFAULT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Workouts" ALTER COLUMN id SET DEFAULT nextval('public."Workouts_id_seq"'::regclass);


--
-- Data for Name: BaseLifts; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."BaseLifts" (id, name, description, video_url, muscle_group, lift_type, equipment, created_at) FROM stdin;
1	Bench Press	Compound chest exercise	\N	Chest	Main	Barbell	2025-04-27 18:17:19.293
2	Squat	Compound leg exercise	\N	Quads	Main	Barbell	2025-04-27 18:17:19.293
3	Tricep Dips	Triceps isolation exercise	\N	Triceps	Supplementary	Bodyweight	2025-04-27 18:17:19.293
\.


--
-- Data for Name: Lifts; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."Lifts" (id, workout_id, base_lift_id, name, completed, sets, reps, reps_achieved, weight, weight_achieved, rpe, rpe_achieved, rest_time, volume, progression_rule, notes, created_at) FROM stdin;
1	1	1	Bench Press	t	3	{8-10,8-10,8-10}	{8,9,10}	{135,135,135}	{135,135,135}	{8-10,8-10,8-10}	{8,9,9}	{90,90,90}	3645	Increase by 5 lbs if completed	\N	2025-04-27 18:17:19.306
2	1	3	Tricep Dips	f	3	{10-12,10-12,10-12}	{10,10,8}	{0,0,0}	{0,0,0}	{7-9,7-9,7-9}	{7,8,8}	{60,60,60}	0	\N	\N	2025-04-27 18:17:19.306
3	2	2	Squat	t	4	{5-7,5-7,5-7,5-7}	{6,6,5,5}	{225,225,225,225}	{225,225,225,225}	{8-10,8-10,8-10,8-10}	{8,9,9,10}	{120,120,120,120}	5400	Increase by 10 lbs if completed	\N	2025-04-27 18:17:19.306
\.


--
-- Data for Name: Plans; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."Plans" (id, user_id, name, categories, description, duration_weeks, difficulty, goal, created_at) FROM stdin;
1	\N	Strength Plan	{Strength,Beginner}	12-week strength program	12	Beginner	Strength	2025-04-27 18:17:19.298
2	1	User Strength Plan	{Strength,Intermediate}	Custom strength program	8	Intermediate	Strength	2025-04-27 18:17:19.298
3	1	Hypertrophy Plan	{Hypertrophy}	\N	10	Intermediate	Hypertrophy	2025-04-27 20:55:02.683
4	2	Hypertrophy Plan	{Hypertrophy}	\N	10	Intermediate	Hypertrophy	2025-04-27 21:46:30.209
5	2	Hypertrophy Plan	{Hypertrophy}	\N	10	Intermediate	Hypertrophy	2025-04-27 21:53:05.081
6	2	Hypertrophy Plan	{Hypertrophy}	\N	10	Intermediate	Hypertrophy	2025-04-28 00:59:14.387
\.


--
-- Data for Name: SupersetLinks; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."SupersetLinks" (id, lift_id, superset_lift_id, created_at) FROM stdin;
1	1	2	2025-04-27 18:17:19.311
\.


--
-- Data for Name: UserLiftsData; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."UserLiftsData" (id, user_id, base_lift_id, max_weights, rep_ranges, max_estimated, created_at) FROM stdin;
2	1	2	{225,245}	{5,3}	{250,270}	2025-04-27 18:17:19.313
1	1	1	{135,145}	{8,5}	{171,160}	2025-04-27 18:17:19.313
3	2	1	{135}	{8}	{171}	2025-04-27 21:46:41.678
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."Users" (id, email, username, password, created_at) FROM stdin;
1	test@example.com	testuser	$2b$10$hgTkKT3hFOkCZKeoHUBgSeLB1RdlIPbUMG/UhMqcEwZRlLqnqpMCi	2025-04-27 18:17:19.288
2	newuser@example.com	newuser	$2b$10$cmuXCGBV7ZTeAVdwThIQ0.VZCg9B3Doqf1RFWsghebB1UwNdbWPTy	2025-04-27 20:24:42.436
3	slab@gmail.com	slabby	$2b$10$PkH7BOViaWmZ7O97k9HjZOe6h75C2/S443NlRM59Mn/Ycblz4oSDa	2025-04-29 22:39:05.325
\.


--
-- Data for Name: Workouts; Type: TABLE DATA; Schema: public; Owner: will
--

COPY public."Workouts" (id, user_id, plan_id, name, week_number, plan_day, day_of_week, iteration, total_volume, created_at) FROM stdin;
2	1	2	Pull Day	1	2	Wednesday	1	\N	2025-04-27 18:17:19.302
1	\N	1	Push Day	1	1	Monday	1	6885	2025-04-27 18:17:19.302
\.


--
-- Name: BaseLifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."BaseLifts_id_seq"', 3, true);


--
-- Name: Lifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."Lifts_id_seq"', 5, true);


--
-- Name: Plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."Plans_id_seq"', 6, true);


--
-- Name: SupersetLinks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."SupersetLinks_id_seq"', 1, true);


--
-- Name: UserLiftsData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."UserLiftsData_id_seq"', 3, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."Users_id_seq"', 3, true);


--
-- Name: Workouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: will
--

SELECT pg_catalog.setval('public."Workouts_id_seq"', 2, true);


--
-- Name: BaseLifts BaseLifts_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."BaseLifts"
    ADD CONSTRAINT "BaseLifts_pkey" PRIMARY KEY (id);


--
-- Name: Lifts Lifts_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Lifts"
    ADD CONSTRAINT "Lifts_pkey" PRIMARY KEY (id);


--
-- Name: Plans Plans_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Plans"
    ADD CONSTRAINT "Plans_pkey" PRIMARY KEY (id);


--
-- Name: SupersetLinks SupersetLinks_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."SupersetLinks"
    ADD CONSTRAINT "SupersetLinks_pkey" PRIMARY KEY (id);


--
-- Name: UserLiftsData UserLiftsData_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."UserLiftsData"
    ADD CONSTRAINT "UserLiftsData_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Workouts Workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Workouts"
    ADD CONSTRAINT "Workouts_pkey" PRIMARY KEY (id);


--
-- Name: BaseLifts_name_key; Type: INDEX; Schema: public; Owner: will
--

CREATE UNIQUE INDEX "BaseLifts_name_key" ON public."BaseLifts" USING btree (name);


--
-- Name: Users_email_key; Type: INDEX; Schema: public; Owner: will
--

CREATE UNIQUE INDEX "Users_email_key" ON public."Users" USING btree (email);


--
-- Name: Users_username_key; Type: INDEX; Schema: public; Owner: will
--

CREATE UNIQUE INDEX "Users_username_key" ON public."Users" USING btree (username);


--
-- Name: Lifts Lifts_base_lift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Lifts"
    ADD CONSTRAINT "Lifts_base_lift_id_fkey" FOREIGN KEY (base_lift_id) REFERENCES public."BaseLifts"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lifts Lifts_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Lifts"
    ADD CONSTRAINT "Lifts_workout_id_fkey" FOREIGN KEY (workout_id) REFERENCES public."Workouts"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Plans Plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Plans"
    ADD CONSTRAINT "Plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SupersetLinks SupersetLinks_lift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."SupersetLinks"
    ADD CONSTRAINT "SupersetLinks_lift_id_fkey" FOREIGN KEY (lift_id) REFERENCES public."Lifts"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupersetLinks SupersetLinks_superset_lift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."SupersetLinks"
    ADD CONSTRAINT "SupersetLinks_superset_lift_id_fkey" FOREIGN KEY (superset_lift_id) REFERENCES public."Lifts"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserLiftsData UserLiftsData_base_lift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."UserLiftsData"
    ADD CONSTRAINT "UserLiftsData_base_lift_id_fkey" FOREIGN KEY (base_lift_id) REFERENCES public."BaseLifts"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserLiftsData UserLiftsData_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."UserLiftsData"
    ADD CONSTRAINT "UserLiftsData_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Workouts Workouts_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Workouts"
    ADD CONSTRAINT "Workouts_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public."Plans"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workouts Workouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: will
--

ALTER TABLE ONLY public."Workouts"
    ADD CONSTRAINT "Workouts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

