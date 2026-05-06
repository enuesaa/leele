static const char *WIFI_SSID = "";
static const char *WIFI_PASSWORD = "";

// curl https://www.amazontrust.com/repository/AmazonRootCA1.pem
static const char *AWSIOT_ROOT_CA = R"(-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----
)";

// file name is xx.cert.pem
static const char *AWSIOT_CERTIFICATE = R"(-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----
)";

// file name is xx.private.key
static const char *AWSIOT_PRIVATE_KEY = R"(-----BEGIN RSA PRIVATE KEY-----
-----END RSA PRIVATE KEY-----
)";

// look up aws iot core console
static const char *AWSIOT_ENDPOINT = "xx.amazonaws.com";
static const char *AWSIOT_THING_ID = "";
