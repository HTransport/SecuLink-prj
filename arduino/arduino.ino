#include <WiFiNINA.h>
#include <SPI.h>
#include <MFRC522.h>

#include "pass.h"

#define SS_PIN 10
#define RST_PIN 9

char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;
char server[] = SECRET_SERVER_IP;

int status = WL_IDLE_STATUS;
int led[] = { 8, 7 };
unsigned long startMillis[] = { 0, 100 }, currentMillis;

String postData;
String macc;

WiFiClient client;

MFRC522 rfid(SS_PIN, RST_PIN);

MFRC522::MIFARE_Key key;

void setup() {

  Serial.begin(9600);
  SPI.begin();      // Init SPI bus
  rfid.PCD_Init();  // Init MFRC522
  pinMode(led[0], OUTPUT);
  pinMode(led[1], OUTPUT);
  digitalWrite(led[0], HIGH);
  digitalWrite(led[1], HIGH);
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    delay(1000);
  }
  byte mac[6];
  WiFi.macAddress(mac);
  macc = String(mac[5], HEX) + ":" + String(mac[4], HEX) + ":" + String(mac[3], HEX) + ":" + String(mac[2], HEX) + ":" + String(mac[1], HEX) + ":" + String(mac[0], HEX);
  macc.toUpperCase();
  digitalWrite(led[0], LOW);
  Serial.println(mac[0]);
  startup();
}

void startup() {
  if (client.connect(server, SECRET_SERVER_PORT)) {
    String request = "GET /api/reader/setup/" + macc + " HTTP/1.1\r\n" +
                     "Host: " + server + ":" + String(SECRET_SERVER_PORT) + "\r\n" +
                     "Connection: close\r\n\r\n";
    client.print(request);
  }
  while (client.connected()) {
    if (client.readStringUntil('\n') == "\r") {
      break;
    }
  }
  // Receiving response body.
  return;
}

int sendAPI(String postData) {
  //if (client.connectSSL(server, SECRET_SERVER_PORT)) {zz
  Serial.println(postData);
  if (client.connect(server, SECRET_SERVER_PORT)) {
    String request = "GET /api/reader/open/" + postData + " HTTP/1.1\r\n" +
                     "Host: " + server + ":" + String(SECRET_SERVER_PORT) + "\r\n" +
                     "Connection: close\r\n\r\n";
    client.print(request);
  } else {
    digitalWrite(led[0], LOW);
    digitalWrite(led[1], LOW);
  }
  while (client.connected()) {
    if (client.readStringUntil('\n') == "\r") {
      break;
    }
  }
  // Receiving response body.

  return client.readStringUntil('\n').toInt();
}

bool checkAccess(String NUID) {
  int resp = sendAPI(NUID + "/" + macc) - 1;
  Serial.println(resp == 1);
  return resp == 1;
}

String printDec(byte *buffer, byte bufferSize) {
  String tempData = "";
  for (byte i = 0; i < bufferSize; i++) {
    tempData += buffer[i] < 0x10 ? " 0" : " ";
    tempData += buffer[i], DEC;
  }
  tempData.remove(0, 1);
  return tempData;
}

void loop() {
  //1 Reset the loop if no new card present on the sensor/reader. This saves the entire process when idle.
  //2 Verify if the NUID has been readed
  currentMillis = millis();
  if (startMillis[0] != 0 && currentMillis - startMillis[0] >= 5000) {
    startMillis[0] = 0;
    digitalWrite(led[0], LOW);
    digitalWrite(led[1], HIGH);
  }

  if (currentMillis - startMillis[1] >= 5000) {
    //sendAPI(String("MAC=") + macc + "&SECRET=" + SECRET_SERVER_KEY);
    startMillis[1] = millis();
  }
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
    return;

  String NUID = printDec(rfid.uid.uidByte, rfid.uid.size);
  NUID.replace(" ", "-");
  Serial.println("NUID: " + NUID);

  if (checkAccess(NUID)) {
    digitalWrite(led[0], HIGH);
    digitalWrite(led[1], LOW);
  } else {
    digitalWrite(led[0], LOW);
    digitalWrite(led[1], LOW);
    delay(100);
    digitalWrite(led[1], HIGH);
    delay(100);
    digitalWrite(led[1], LOW);
    delay(100);
    digitalWrite(led[1], HIGH);
  }
  startMillis[0] = millis();

  // Halt PICC
  rfid.PICC_HaltA();

  // Stop encryption on PCD
  rfid.PCD_StopCrypto1();
}
