CREATE SCHEMA IF NOT EXISTS "auth";
CREATE SCHEMA IF NOT EXISTS "app";

CREATE TABLE IF NOT EXISTS "auth"."user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique"
  ON "auth"."user" USING btree ("email");

CREATE TABLE IF NOT EXISTS "auth"."session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL,
  CONSTRAINT "session_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique"
  ON "auth"."session" USING btree ("token");
CREATE INDEX IF NOT EXISTS "session_user_id_idx"
  ON "auth"."session" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "auth"."account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "scope" text,
  "password" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "account_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_unique"
  ON "auth"."account" USING btree ("provider_id", "account_id");
CREATE INDEX IF NOT EXISTS "account_user_id_idx"
  ON "auth"."account" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "auth"."verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
  ON "auth"."verification" USING btree ("identifier");

CREATE TABLE IF NOT EXISTS "app"."center" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(64) NOT NULL,
  "name" varchar(200) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "center_code_unique"
  ON "app"."center" USING btree ("code");

CREATE TABLE IF NOT EXISTS "app"."membership" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "center_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "membership_center_id_center_id_fk"
    FOREIGN KEY ("center_id") REFERENCES "app"."center"("id") ON DELETE cascade,
  CONSTRAINT "membership_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "membership_center_user_unique"
  ON "app"."membership" USING btree ("center_id", "user_id");
CREATE INDEX IF NOT EXISTS "membership_user_idx"
  ON "app"."membership" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "app"."role" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(64) NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_key_unique"
  ON "app"."role" USING btree ("key");

CREATE TABLE IF NOT EXISTS "app"."permission" (
  "key" varchar(120) PRIMARY KEY NOT NULL,
  "description" text
);

CREATE TABLE IF NOT EXISTS "app"."membership_role" (
  "membership_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  CONSTRAINT "membership_role_membership_id_role_id_pk"
    PRIMARY KEY ("membership_id", "role_id"),
  CONSTRAINT "membership_role_membership_id_membership_id_fk"
    FOREIGN KEY ("membership_id") REFERENCES "app"."membership"("id") ON DELETE cascade,
  CONSTRAINT "membership_role_role_id_role_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "app"."role"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "app"."role_permission" (
  "role_id" uuid NOT NULL,
  "permission_key" varchar(120) NOT NULL,
  CONSTRAINT "role_permission_role_id_permission_key_pk"
    PRIMARY KEY ("role_id", "permission_key"),
  CONSTRAINT "role_permission_role_id_role_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "app"."role"("id") ON DELETE cascade,
  CONSTRAINT "role_permission_permission_key_permission_key_fk"
    FOREIGN KEY ("permission_key") REFERENCES "app"."permission"("key") ON DELETE cascade
);
