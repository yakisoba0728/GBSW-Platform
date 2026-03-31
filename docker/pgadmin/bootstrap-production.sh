#!/bin/sh
set -eu

storage_user="${PGADMIN_DEFAULT_EMAIL:-}"

case "$storage_user" in
  "" | [0-9]*)
    storage_user="pga_user_${storage_user}"
    ;;
esac

storage_user=$(printf '%s' "$storage_user" | sed 's/@/_/g; s#/#slash#g; s#\\#slash#g')
pgpass_path="/var/lib/pgadmin/storage/${storage_user}/.pgpass"
server_json_path="/tmp/servers.production.json"

mkdir -p "$(dirname "$pgpass_path")"
umask 077
printf '%s\n' "db:5432:${POSTGRES_DB}:${POSTGRES_USER}:${POSTGRES_PASSWORD}" > "$pgpass_path"
chmod 600 "$pgpass_path"

cat > "$server_json_path" <<EOF
{
  "Servers": {
    "1": {
      "Name": "GBSW Platform DB",
      "Group": "Servers",
      "Host": "db",
      "Port": 5432,
      "MaintenanceDB": "${POSTGRES_DB}",
      "Username": "${POSTGRES_USER}",
      "SSLMode": "prefer",
      "ConnectionParameters": {
        "passfile": "${pgpass_path}",
        "sslmode": "prefer",
        "connect_timeout": 10
      }
    }
  }
}
EOF

export PGADMIN_SERVER_JSON_FILE="$server_json_path"
export PGADMIN_REPLACE_SERVERS_ON_STARTUP=True
export PGPASS_FILE="$pgpass_path"

exec /entrypoint.sh "$@"
