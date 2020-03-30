-- PGSQL Dialect

CREATE EXTENSION "postgis";
CREATE EXTENSION "uuid-ossp";

CREATE TABLE accesstoken
(
    id text NOT NULL,
    ttl integer DEFAULT 1209600,
    scopes text,
    created timestamp with time zone,
    userid integer,
    CONSTRAINT accesstoken_pkey PRIMARY KEY (id)
);

CREATE SEQUENCE user_id_seq
    INCREMENT 1
    START 2
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

CREATE TABLE "user"
(
    realm text,
    username text,
    password text NOT NULL,
    email text NOT NULL,
    emailverified boolean,
    verificationtoken text,
    id integer NOT NULL DEFAULT nextval('user_id_seq'::regclass),
    CONSTRAINT user_pkey PRIMARY KEY (id)
);

CREATE TABLE helper
(
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    "position" text NOT NULL,
    gps_coordinates point NOT NULL,
    nombre_hebergement integer NOT NULL,
    approvisionnement boolean NOT NULL,
    autres boolean NOT NULL,
    conseils boolean NOT NULL DEFAULT false,
    id uuid,
    need_help_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gps_coordinates_geo geography
);

create index helper_id_idx on helper (id);
create index helper_nom_idx on helper (nom);
create index helper_prenom_idx on helper (prenom);
create index helper_email_idx on helper (email);
create index helper_need_help_id_idx on helper (need_help_id);
create index helper_gps_coordinates_geo_idx on helper using GIST(gps_coordinates_geo);

CREATE TABLE needhelp
(
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    "position" text NOT NULL,
    gps_coordinates point NOT NULL,
    nombre_hebergement integer NOT NULL,
    approvisionnement boolean NOT NULL,
    autres boolean NOT NULL,
    conseils boolean NOT NULL DEFAULT false,
    id uuid,
    helper_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gps_coordinates_geo geography
);

create index needhelp_id_idx on           needhelp (id);
create index needhelp_nom_idx on          needhelp (nom);
create index needhelp_prenom_idx on       needhelp (prenom);
create index needhelp_email_idx on        needhelp (email);
create index needhelp_need_help_id_idx on needhelp (helper_id);
create index needhelp_gps_coordinates_geo_idx on needhelp using GIST(gps_coordinates_geo);
