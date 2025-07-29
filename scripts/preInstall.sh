#set env vars
set -o allexport; source .env; set +o allexport;

if [ -e "./initialized" ]; then
    echo "Already initialized, skipping..."
else

mkdir -p ./vibecoder
mkdir -p ./vibecoder/img

chown -R 1000:1000 ./vibecoder/img
chmod -R 777 ./vibecoder/img

sed -i "s~DOMAIN_TO_CHANGE~${DOMAIN}~g" ./docker-compose.yml
sed -i "s~0.0.0.0~${IP}~g" ./docker-compose.yml

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get update
sudo apt-get install -y nodejs
node -v
npm -v
npm i -g  @anthropic-ai/claude-code

sed -i "s~DOMAIN_TO_CHANGE~${DOMAIN}~g" ./html/index.html
sed -i "s~DOMAIN_TO_CHANGE~${DOMAIN}~g" ./README.md

touch /opt/elestio/nginx/streams/${DOMAIN}-tcp_udp.conf

CURRENT_DIR=$(pwd)

FOLDER_NAME=$(echo "$CURRENT_DIR" | sed 's|/opt/app/||')

if [ "$CURRENT_DIR" = "/opt/app" ]; then
    :
else
    echo "CI_CD_FOLDER=$FOLDER_NAME" >> .env
    sed -i "s~/opt/app~/opt/app/$FOLDER_NAME~g" ./CLAUDE.md
fi

touch "./initialized"
fi