const express = require("express");
const app = express();
const sql = require("mssql");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const upload = multer({ dest: "uploads/" });

app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const config = {
  user: "username",
  password: "password",
  server: "server", // or IP address
  port: 0000,
  database: "database name",
  options: {
    encrypt: true, // for security
    trustServerCertificate: true,
    validateBulkLoadParameters: true,
    enableArithAbort: true,
  },
};

const pool = new sql.ConnectionPool(config);

pool.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected to SQL Server");

    app.get("/", (req, res) => {
      // Lookup for a single number
      res.send("Welcome to Flash CALL BLOCK Project. Specify a route.");
    });

    app.get("/androidHistory", (req, res) => {
      pool
        .request()
        .query(
          "Select PhoneNumber from AndroidHistoryBlackList",
          (err, result) => {
            if (err) {
              console.error(err);
            } else {
              const phoneNumbers = result.recordset.map(
                (obj) => obj.PhoneNumber
              );
              console.log(phoneNumbers);
              const phoneNumberObjects = phoneNumbers.map((phoneNumber) => {
                return { PhoneNumber: phoneNumber };
              });
              console.log(phoneNumberObjects);
              res.status(200).send(phoneNumberObjects);
            }
          }
        );
    });

    app.post("/androidNBLookup", (req, res) => {
      const num = {
        number: req.body.number,
      };
      let phoneNb = num.number;

      const currentDate = new Date();
      axios
        .get(
          //Key          //Secret
          "https://api.tmtvelocity.com/live/json/key/secret/" +
            phoneNb
        )
        .then((response) => {
          console.log("Checking number: " + phoneNb);
          let thisNetworkName = undefined;
          let thisported = null;
          let thisAssigned = undefined;
          let thisPhoneType = undefined;

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "network"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisNetworkName = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (innerObj.hasOwnProperty(innerKey) && innerKey === "type") {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisPhoneType = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "present"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisAssigned = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "ported"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisported = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "status_message"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  if (dynamicAttrValue == "Invalid Number") {
                    const result = {
                      NetworkName: "NUMBER INVALID",
                    };
                    res.status(200).send(result);
                    console.log("NUMBER INVALID!");
                    let timeStamp = currentDate.getTime();
                    let dateFormat = new Date(timeStamp).toLocaleString(
                      "en-US"
                    );
                    console.log(dateFormat);

                    pool
                      .request()
                      .query(
                        "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                          phoneNb +
                          ", N'na', N'na', N'na', N'na', N'INVALID NUMBER', N'" +
                          dateFormat +
                          "');",
                        (err, result) => {
                          if (err) {
                            console.error(err);
                          } else {
                            console.log(
                              "Record inserted to database successfully!"
                            );
                          }
                        }
                      );

                    pool
                      .request()
                      .query(
                        "INSERT INTO FlashCall.dbo.Invalid_Numbers (PhoneNumber)VALUES (" +
                          phoneNb +
                          ");",
                        (err, result) => {
                          if (err) {
                            console.error(
                              "Number already inserted to table Invalid_Numbers!"
                            );
                          } else {
                            console.log(
                              "Record inserted to database successfully!"
                            );
                          }
                        }
                      );
                  } else {
                    for (let key in response.data) {
                      if (response.data.hasOwnProperty(key)) {
                        const innerObj = response.data[key];
                        for (let innerKey in innerObj) {
                          if (
                            innerObj.hasOwnProperty(innerKey) &&
                            innerKey === "network"
                          ) {
                            const dynamicAttrValue = innerObj[innerKey];
                            if (
                              dynamicAttrValue == "Sinch Voice-NSR-10X/1" ||
                              dynamicAttrValue == "BANDWIDTH.COM-NSR-10X/1"
                            ) {
                              const result = {
                                NetworkName: "Sinch Voice-NSR-10X/1",
                              };
                              res.status(200).send(result);
                              console.log(
                                "NUMBER FROM " +
                                  dynamicAttrValue +
                                  "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                              );

                              pool
                                .request()
                                .query(
                                  "INSERT INTO FlashCall.dbo.AndroidHistoryBlackList (PhoneNumber)VALUES (" +
                                    phoneNb +
                                    ");",
                                  (err, result) => {
                                    if (err) {
                                      console.error(err);
                                    } else {
                                      console.log(
                                        "Record inserted to database successfully!"
                                      );
                                    }
                                  }
                                );

                              pool
                                .request()
                                .query(
                                  "INSERT INTO FlashCall.dbo.BlackListed_Phones (PhoneNumber, NetworkName, Assigned, PhoneType, Ported)VALUES (" +
                                    phoneNb +
                                    ", N'" +
                                    dynamicAttrValue +
                                    "', N'na', N'fixed', N'" +
                                    thisported +
                                    "');",
                                  (err, result) => {
                                    if (err) {
                                      console.error(
                                        "Number already blacklisted!"
                                      );
                                    } else {
                                      console.log(
                                        "Record inserted to database successfully!"
                                      );
                                    }
                                  }
                                );

                              let timeStamp = currentDate.getTime();
                              let dateFormat = new Date(
                                timeStamp
                              ).toLocaleString("en-US");
                              console.log(dateFormat);

                              pool
                                .request()
                                .query(
                                  "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                    phoneNb +
                                    ", N'" +
                                    dynamicAttrValue +
                                    "', N'na', N'fixed', N'false', N'VALID NUMBER', N'" +
                                    dateFormat +
                                    "');",
                                  (err, result) => {
                                    if (err) {
                                      console.error(err);
                                    } else {
                                      console.log(
                                        "Record inserted to database successfully!"
                                      );
                                    }
                                  }
                                );
                            } else {
                              for (let key in response.data) {
                                if (response.data.hasOwnProperty(key)) {
                                  const innerObj = response.data[key];
                                  for (let innerKey in innerObj) {
                                    if (
                                      innerObj.hasOwnProperty(innerKey) &&
                                      innerKey === "present"
                                    ) {
                                      const dynamicAttrValue =
                                        innerObj[innerKey];
                                      if (
                                        dynamicAttrValue == "no" ||
                                        dynamicAttrValue == "na"
                                      ) {
                                        const result = {
                                          NetworkName:
                                            "Not from sinch and not assigned.",
                                        };
                                        console.log(
                                          "Number Not From Sinch & NOT ASSIGNED!"
                                        );
                                        res.status(200).send(result);
                                        let timeStamp = currentDate.getTime();
                                        let dateFormat = new Date(
                                          timeStamp
                                        ).toLocaleString("en-US");
                                        console.log(dateFormat);
                                        pool
                                          .request()
                                          .query(
                                            "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                              phoneNb +
                                              ", N'" +
                                              thisNetworkName +
                                              "', N'" +
                                              dynamicAttrValue +
                                              "', N'" +
                                              thisPhoneType +
                                              "', N'" +
                                              thisported +
                                              "', N'VALID NUMBER', N'" +
                                              dateFormat +
                                              "');",
                                            (err, result) => {
                                              if (err) {
                                                console.error(err);
                                              } else {
                                                console.log(
                                                  "Record inserted to database successfully!"
                                                );
                                              }
                                            }
                                          );

                                        pool
                                          .request()
                                          .query(
                                            "INSERT INTO FlashCall.dbo.Not_Assigned_Numbers (PhoneNumber)VALUES (" +
                                              phoneNb +
                                              ");",
                                            (err, result) => {
                                              if (err) {
                                                console.error(
                                                  "Already present at table Not_Assigned_Numbers!"
                                                );
                                              } else {
                                                console.log(
                                                  "Record inserted to database successfully!"
                                                );
                                              }
                                            }
                                          );
                                      } else {
                                        const result = {
                                          NetworkName: "NOT FROM SINCH",
                                        };
                                        res.status(200).send(result);
                                        console.log("Number Not From Sinch");
                                        let timeStamp = currentDate.getTime();
                                        let dateFormat = new Date(
                                          timeStamp
                                        ).toLocaleString("en-US");
                                        console.log(dateFormat);
                                        pool
                                          .request()
                                          .query(
                                            "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                              phoneNb +
                                              ", N'" +
                                              thisNetworkName +
                                              "', N'" +
                                              thisAssigned +
                                              "', N'" +
                                              thisPhoneType +
                                              "', N'" +
                                              thisported +
                                              "', N'VALID NUMBER', N'" +
                                              dateFormat +
                                              "');",
                                            (err, result) => {
                                              if (err) {
                                                console.error(err);
                                              } else {
                                                console.log(
                                                  "Record inserted to database successfully!"
                                                );
                                              }
                                            }
                                          );
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error(error);
          const result = {
            NetworkName: "INVALID!",
          };
          res.status(400).send(result);
        });
    });

    app.post("/nb", (req, res) => {
      const phoneNb = req.body.phoneNumber;
      const currentDate = new Date();
      axios
        .get(
          //Key          //Secret
          "https://api.tmtvelocity.com/live/json/key/secret/" +
            phoneNb
        )
        .then((response) => {
          console.log("Checking number: " + phoneNb);
          let thisNetworkName = undefined;
          let thisported = null;
          let thisAssigned = undefined;
          let thisPhoneType = undefined;

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "network"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisNetworkName = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (innerObj.hasOwnProperty(innerKey) && innerKey === "type") {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisPhoneType = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "present"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisAssigned = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "ported"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  thisported = dynamicAttrValue;
                }
              }
            }
          }

          for (let key in response.data) {
            if (response.data.hasOwnProperty(key)) {
              const innerObj = response.data[key];
              for (let innerKey in innerObj) {
                if (
                  innerObj.hasOwnProperty(innerKey) &&
                  innerKey === "status_message"
                ) {
                  const dynamicAttrValue = innerObj[innerKey];
                  if (dynamicAttrValue == "Invalid Number") {
                    res.send(
                      "NUMBER INVALID!\n FOR REFERENCE:\n" +
                        JSON.stringify(response.data)
                    );
                    console.log("NUMBER INVALID!");

                    let timeStamp = currentDate.getTime();
                    let dateFormat = new Date(timeStamp).toLocaleString(
                      "en-US"
                    );
                    console.log(dateFormat);

                    pool
                      .request()
                      .query(
                        "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                          phoneNb +
                          ", N'na', N'na', N'na', N'na', N'INVALID NUMBER', N'" +
                          dateFormat +
                          "');",
                        (err, result) => {
                          if (err) {
                            console.error(err);
                          } else {
                            console.log(
                              "Record inserted to database successfully!"
                            );
                          }
                        }
                      );

                    pool
                      .request()
                      .query(
                        "INSERT INTO FlashCall.dbo.Invalid_Numbers (PhoneNumber)VALUES (" +
                          phoneNb +
                          ");",
                        (err, result) => {
                          if (err) {
                            console.error(
                              "Number already inserted to table Invalid_Numbers!"
                            );
                          } else {
                            console.log(
                              "Record inserted to database successfully!"
                            );
                          }
                        }
                      );
                  } else {
                    for (let key in response.data) {
                      if (response.data.hasOwnProperty(key)) {
                        const innerObj = response.data[key];
                        for (let innerKey in innerObj) {
                          if (
                            innerObj.hasOwnProperty(innerKey) &&
                            innerKey === "network"
                          ) {
                            const dynamicAttrValue = innerObj[innerKey];
                            if (
                              dynamicAttrValue == "Sinch Voice-NSR-10X/1" ||
                              dynamicAttrValue == "BANDWIDTH.COM-NSR-10X/1"
                            ) {
                              res.send(
                                "NUMBER FROM " +
                                  dynamicAttrValue +
                                  "!\n FOR REFERENCE:\n" +
                                  JSON.stringify(response.data)
                              );
                              console.log(
                                "NUMBER FROM " +
                                  dynamicAttrValue +
                                  "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                              );

                              pool
                                .request()
                                .query(
                                  "INSERT INTO FlashCall.dbo.BlackListed_Phones (PhoneNumber, NetworkName, Assigned, PhoneType, Ported)VALUES (" +
                                    phoneNb +
                                    ", N'" +
                                    dynamicAttrValue +
                                    "', N'" +
                                    thisAssigned +
                                    "', N'" +
                                    thisPhoneType +
                                    "', N'" +
                                    thisported +
                                    "');",
                                  (err, result) => {
                                    if (err) {
                                      console.error(
                                        "Number already blacklisted!"
                                      );
                                    } else {
                                      console.log(
                                        "Record inserted to database successfully!"
                                      );
                                    }
                                  }
                                );

                              let timeStamp = currentDate.getTime();
                              let dateFormat = new Date(
                                timeStamp
                              ).toLocaleString("en-US");
                              console.log(dateFormat);

                              pool
                                .request()
                                .query(
                                  "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                    phoneNb +
                                    ", N'" +
                                    dynamicAttrValue +
                                    "', N'na', N'" +
                                    thisPhoneType +
                                    "', N'" +
                                    thisported +
                                    "', N'VALID NUMBER', N'" +
                                    dateFormat +
                                    "');",
                                  (err, result) => {
                                    if (err) {
                                      console.error(err);
                                    } else {
                                      console.log(
                                        "Record inserted to database successfully!"
                                      );
                                    }
                                  }
                                );
                            } else {
                              for (let key in response.data) {
                                if (response.data.hasOwnProperty(key)) {
                                  const innerObj = response.data[key];
                                  for (let innerKey in innerObj) {
                                    if (
                                      innerObj.hasOwnProperty(innerKey) &&
                                      innerKey === "present"
                                    ) {
                                      const dynamicAttrValue =
                                        innerObj[innerKey];
                                      if (
                                        dynamicAttrValue == "no" ||
                                        dynamicAttrValue == "na"
                                      ) {
                                        res.send(
                                          "Number Not From Sinch & NOT ASSIGNED!\n FOR REFERENCE:\n" +
                                            JSON.stringify(response.data)
                                        );
                                        console.log(
                                          "Number Not From Sinch & NOT ASSIGNED!"
                                        );
                                        let timeStamp = currentDate.getTime();
                                        let dateFormat = new Date(
                                          timeStamp
                                        ).toLocaleString("en-US");
                                        console.log(dateFormat);
                                        pool
                                          .request()
                                          .query(
                                            "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                              phoneNb +
                                              ", N'" +
                                              thisNetworkName +
                                              "', N'" +
                                              dynamicAttrValue +
                                              "', N'" +
                                              thisPhoneType +
                                              "', N'" +
                                              thisported +
                                              "', N'VALID NUMBER', N'" +
                                              dateFormat +
                                              "');",
                                            (err, result) => {
                                              if (err) {
                                                console.error(err);
                                              } else {
                                                console.log(
                                                  "Record inserted to database successfully!"
                                                );
                                              }
                                            }
                                          );

                                        pool
                                          .request()
                                          .query(
                                            "INSERT INTO FlashCall.dbo.Not_Assigned_Numbers (PhoneNumber)VALUES (" +
                                              phoneNb +
                                              ");",
                                            (err, result) => {
                                              if (err) {
                                                console.error(
                                                  "Already present at table Not_Assigned_Numbers!"
                                                );
                                              } else {
                                                console.log(
                                                  "Record inserted to database successfully!"
                                                );
                                              }
                                            }
                                          );
                                      } else {
                                        res.send(
                                          "Number Not From Sinch\n FOR REFERENCE:\n" +
                                            JSON.stringify(response.data)
                                        );
                                        console.log("Number Not From Sinch");
                                        let timeStamp = currentDate.getTime();
                                        let dateFormat = new Date(
                                          timeStamp
                                        ).toLocaleString("en-US");
                                        console.log(dateFormat);
                                        pool
                                          .request()
                                          .query(
                                            "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                              phoneNb +
                                              ", N'" +
                                              thisNetworkName +
                                              "', N'" +
                                              thisAssigned +
                                              "', N'" +
                                              thisPhoneType +
                                              "', N'" +
                                              thisported +
                                              "', N'VALID NUMBER', N'" +
                                              dateFormat +
                                              "');",
                                            (err, result) => {
                                              if (err) {
                                                console.error(err);
                                              } else {
                                                console.log(
                                                  "Record inserted to database successfully!"
                                                );
                                              }
                                            }
                                          );
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error(error);
          res.sendStatus(400);
        });
    });

    app.post("/iterative", (req, res) => {
      const phoneNb = req.body.phoneNumber; // For iterative Lookup
      const phoneNb2 = req.body.phoneNumber2;
      const iterativeNb = req.body.addby;
      let x = 0;
      const currentDate = new Date();

      console.log(
        "Checking from number: " +
          phoneNb +
          " to number: " +
          phoneNb2 +
          " iterating by: " +
          iterativeNb
      );

      if (parseInt(phoneNb) < parseInt(phoneNb2)) {
        for (
          let i = parseInt(phoneNb);
          i <= parseInt(phoneNb2);
          i += parseInt(iterativeNb)
        ) {
          axios
            .get(
              //Key          //Secret
              "https://api.tmtvelocity.com/live/json/key/secret/" +
                i
            )
            .then((response) => {
              let thisNetworkName = undefined;
              let thisported = null;
              let thisAssigned = undefined;
              let thisPhoneType = undefined;

              for (let key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                  const innerObj = response.data[key];
                  for (let innerKey in innerObj) {
                    if (
                      innerObj.hasOwnProperty(innerKey) &&
                      innerKey === "network"
                    ) {
                      const dynamicAttrValue = innerObj[innerKey];
                      thisNetworkName = dynamicAttrValue;
                    }
                  }
                }
              }

              for (let key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                  const innerObj = response.data[key];
                  for (let innerKey in innerObj) {
                    if (
                      innerObj.hasOwnProperty(innerKey) &&
                      innerKey === "type"
                    ) {
                      const dynamicAttrValue = innerObj[innerKey];
                      thisPhoneType = dynamicAttrValue;
                    }
                  }
                }
              }

              for (let key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                  const innerObj = response.data[key];
                  for (let innerKey in innerObj) {
                    if (
                      innerObj.hasOwnProperty(innerKey) &&
                      innerKey === "present"
                    ) {
                      const dynamicAttrValue = innerObj[innerKey];
                      thisAssigned = dynamicAttrValue;
                    }
                  }
                }
              }

              for (let key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                  const innerObj = response.data[key];
                  for (let innerKey in innerObj) {
                    if (
                      innerObj.hasOwnProperty(innerKey) &&
                      innerKey === "ported"
                    ) {
                      const dynamicAttrValue = innerObj[innerKey];
                      thisported = dynamicAttrValue;
                    }
                  }
                }
              }

              for (let key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                  const innerObj = response.data[key];
                  for (let innerKey in innerObj) {
                    if (
                      innerObj.hasOwnProperty(innerKey) &&
                      innerKey === "status_message"
                    ) {
                      const dynamicAttrValue = innerObj[innerKey];
                      if (dynamicAttrValue == "Invalid Number") {
                        console.log("NUMBER INVALID!");

                        let timeStamp = currentDate.getTime();
                        let dateFormat = new Date(timeStamp).toLocaleString(
                          "en-US"
                        );
                        console.log(dateFormat);

                        pool
                          .request()
                          .query(
                            "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                              i +
                              ", N'na', N'na', N'na', N'na', N'INVALID NUMBER', N'" +
                              dateFormat +
                              "');",
                            (err, result) => {
                              if (err) {
                                console.error(err);
                              } else {
                                console.log(
                                  "Record inserted to database successfully!"
                                );
                              }
                            }
                          );

                        pool
                          .request()
                          .query(
                            "INSERT INTO FlashCall.dbo.Invalid_Numbers (PhoneNumber)VALUES (" +
                              i +
                              ");",
                            (err, result) => {
                              if (err) {
                                console.error(
                                  "Number already inserted to table Invalid_Numbers!"
                                );
                              } else {
                                console.log(
                                  "Record inserted to database successfully!"
                                );
                              }
                            }
                          );
                      } else {
                        for (let key in response.data) {
                          if (response.data.hasOwnProperty(key)) {
                            const innerObj = response.data[key];
                            for (let innerKey in innerObj) {
                              if (
                                innerObj.hasOwnProperty(innerKey) &&
                                innerKey === "network"
                              ) {
                                const dynamicAttrValue = innerObj[innerKey];
                                if (
                                  dynamicAttrValue == "Sinch Voice-NSR-10X/1" ||
                                  dynamicAttrValue == "BANDWIDTH.COM-NSR-10X/1"
                                ) {
                                  console.log(
                                    "NUMBER FROM " +
                                      dynamicAttrValue +
                                      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                  );

                                  pool
                                    .request()
                                    .query(
                                      "INSERT INTO FlashCall.dbo.BlackListed_Phones (PhoneNumber, NetworkName, Assigned, PhoneType, Ported)VALUES (" +
                                        i +
                                        ", N'" +
                                        dynamicAttrValue +
                                        "', N'" +
                                        thisAssigned +
                                        "', N'" +
                                        thisPhoneType +
                                        "', N'" +
                                        thisported +
                                        "');",
                                      (err, result) => {
                                        if (err) {
                                          console.error(
                                            "Number already blacklisted!"
                                          );
                                        } else {
                                          console.log(
                                            "Record inserted to database successfully!"
                                          );
                                        }
                                      }
                                    );

                                  let timeStamp = currentDate.getTime();
                                  let dateFormat = new Date(
                                    timeStamp
                                  ).toLocaleString("en-US");
                                  console.log(dateFormat);

                                  pool
                                    .request()
                                    .query(
                                      "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                        i +
                                        ", N'" +
                                        dynamicAttrValue +
                                        "', N'" +
                                        thisAssigned +
                                        "', N'" +
                                        thisPhoneType +
                                        "', N'" +
                                        thisported +
                                        "', N'VALID NUMBER', N'" +
                                        dateFormat +
                                        "');",
                                      (err, result) => {
                                        if (err) {
                                          console.error(err);
                                        } else {
                                          console.log(
                                            "Record inserted to database successfully!"
                                          );
                                        }
                                      }
                                    );
                                } else {
                                  for (let key in response.data) {
                                    if (response.data.hasOwnProperty(key)) {
                                      const innerObj = response.data[key];
                                      for (let innerKey in innerObj) {
                                        if (
                                          innerObj.hasOwnProperty(innerKey) &&
                                          innerKey === "present"
                                        ) {
                                          const dynamicAttrValue =
                                            innerObj[innerKey];
                                          if (
                                            dynamicAttrValue == "no" ||
                                            dynamicAttrValue == "na"
                                          ) {
                                            console.log(
                                              "Number Not From Sinch & NOT ASSIGNED!"
                                            );
                                            let timeStamp =
                                              currentDate.getTime();
                                            let dateFormat = new Date(
                                              timeStamp
                                            ).toLocaleString("en-US");
                                            console.log(dateFormat);
                                            pool
                                              .request()
                                              .query(
                                                "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                                  i +
                                                  ", N'" +
                                                  thisNetworkName +
                                                  "', N'" +
                                                  dynamicAttrValue +
                                                  "', N'" +
                                                  thisPhoneType +
                                                  "', N'" +
                                                  thisported +
                                                  "', N'VALID NUMBER', N'" +
                                                  dateFormat +
                                                  "');",
                                                (err, result) => {
                                                  if (err) {
                                                    console.error(err);
                                                  } else {
                                                    console.log(
                                                      "Record inserted to database successfully!"
                                                    );
                                                  }
                                                }
                                              );

                                            pool
                                              .request()
                                              .query(
                                                "INSERT INTO FlashCall.dbo.Not_Assigned_Numbers (PhoneNumber)VALUES (" +
                                                  i +
                                                  ");",
                                                (err, result) => {
                                                  if (err) {
                                                    console.error(
                                                      "Already present at table Not_Assigned_Numbers!"
                                                    );
                                                  } else {
                                                    console.log(
                                                      "Record inserted to database successfully!"
                                                    );
                                                  }
                                                }
                                              );
                                          } else {
                                            console.log(
                                              "Number Not From Sinch"
                                            );
                                            let timeStamp =
                                              currentDate.getTime();
                                            let dateFormat = new Date(
                                              timeStamp
                                            ).toLocaleString("en-US");
                                            console.log(dateFormat);
                                            pool
                                              .request()
                                              .query(
                                                "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                                  i +
                                                  ", N'" +
                                                  thisNetworkName +
                                                  "', N'" +
                                                  thisAssigned +
                                                  "', N'" +
                                                  thisPhoneType +
                                                  "', N'" +
                                                  thisported +
                                                  "', N'VALID NUMBER', N'" +
                                                  dateFormat +
                                                  "');",
                                                (err, result) => {
                                                  if (err) {
                                                    console.error(err);
                                                  } else {
                                                    console.log(
                                                      "Record inserted to database successfully!"
                                                    );
                                                  }
                                                }
                                              );
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            })
            .catch((error) => {
              console.error(error);
            });
        }
        res.send("Check your database.");
      } else {
        console.log("PHONE NUMBER 1 MUST BE SMALLER THAN PHONE NUMBER 2!");
        res.send("PHONE NUMBER 1 MUST BE SMALLER THAN PHONE NUMBER 2!");
      }
    });

    app.get("/nb::nb", (req, res) => {
      const phoneNb = req.params.nb;
      console.log(phoneNb);
      axios
        .get(
          //Key          //Secret
          "https://api.tmtvelocity.com/live/json/key/secret/" +
            phoneNb
        )
        .then((response) => {
          res.send(response.data);
          console.log(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    });

    app.post("/uploadcsv", upload.single("csvFile"), (req, res) => {
      // Lookup for range of number from csv file

      const currentDate = new Date();
      const results = [];
      const oldPath = req.file.path;
      // const newPath = `uploads/${req.file.originalname}`;
      const newPath = `uploads/csv.csv`;
      fs.rename(oldPath, newPath, (err) => {
        if (err) throw err;
        fs.createReadStream(newPath)
          .pipe(csv())
          .on("data", (data) => {
            console.log("Upload and rename was a success");
          })
          .on("end", () => {
            console.log("File uploaded and renamed!");
          });
      });
      const SinchARR = [];
      fs.createReadStream("uploads/csv.csv")
        .pipe(csv())
        .on("data", (data) => {
          const requiredData = {
            column1: data["numbers"],
          };
          results.push(requiredData);
        })
        .on("end", () => {
          const numbers = results.map((number) => number.column1);
          console.log("Looking up for " + numbers.length + " numbers");
          console.log("START");
          for (let i = 0; i < results.length; i++) {
            axios
              .get(
                //Key          //Secret
                "https://api.tmtvelocity.com/live/json/key/secret/" +
                  numbers[i]
              )
              .then((response) => {
                console.log("Checking number " + i + ": " + numbers[i]);

                let thisNetworkName = undefined;
                let thisported = null;
                let thisAssigned = undefined;
                let thisPhoneType = undefined;

                for (let key in response.data) {
                  if (response.data.hasOwnProperty(key)) {
                    const innerObj = response.data[key];
                    for (let innerKey in innerObj) {
                      if (
                        innerObj.hasOwnProperty(innerKey) &&
                        innerKey === "network"
                      ) {
                        const dynamicAttrValue = innerObj[innerKey];
                        thisNetworkName = dynamicAttrValue;
                      }
                    }
                  }
                }

                for (let key in response.data) {
                  if (response.data.hasOwnProperty(key)) {
                    const innerObj = response.data[key];
                    for (let innerKey in innerObj) {
                      if (
                        innerObj.hasOwnProperty(innerKey) &&
                        innerKey === "type"
                      ) {
                        const dynamicAttrValue = innerObj[innerKey];
                        thisPhoneType = dynamicAttrValue;
                      }
                    }
                  }
                }

                for (let key in response.data) {
                  if (response.data.hasOwnProperty(key)) {
                    const innerObj = response.data[key];
                    for (let innerKey in innerObj) {
                      if (
                        innerObj.hasOwnProperty(innerKey) &&
                        innerKey === "present"
                      ) {
                        const dynamicAttrValue = innerObj[innerKey];
                        thisAssigned = dynamicAttrValue;
                      }
                    }
                  }
                }

                for (let key in response.data) {
                  if (response.data.hasOwnProperty(key)) {
                    const innerObj = response.data[key];
                    for (let innerKey in innerObj) {
                      if (
                        innerObj.hasOwnProperty(innerKey) &&
                        innerKey === "ported"
                      ) {
                        const dynamicAttrValue = innerObj[innerKey];
                        thisported = dynamicAttrValue;
                      }
                    }
                  }
                }

                for (let key in response.data) {
                  if (response.data.hasOwnProperty(key)) {
                    const innerObj = response.data[key];
                    for (let innerKey in innerObj) {
                      if (
                        innerObj.hasOwnProperty(innerKey) &&
                        innerKey === "status_message"
                      ) {
                        const dynamicAttrValue = innerObj[innerKey];
                        if (dynamicAttrValue == "Invalid Number") {
                          res.send(
                            "NUMBER INVALID!\n FOR REFERENCE:\n" +
                              JSON.stringify(response.data)
                          );
                          console.log("NUMBER INVALID!");
                          let timeStamp = currentDate.getTime();
                          let dateFormat = new Date(timeStamp).toLocaleString(
                            "en-US"
                          );
                          console.log(dateFormat);
                          pool
                            .request()
                            .query(
                              "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                numbers[i] +
                                ", N'na', N'na', N'na', N'na', N'INVALID NUMBER, N'" +
                                dateFormat +
                                "'');",
                              (err, result) => {
                                if (err) {
                                  console.error("err 4");
                                } else {
                                  console.log(
                                    "Record inserted to database successfully!"
                                  );
                                }
                              }
                            );

                          pool
                            .request()
                            .query(
                              "INSERT INTO FlashCall.dbo.Invalid_Numbers (PhoneNumber)VALUES (" +
                                numbers[i] +
                                ");",
                              (err, result) => {
                                if (err) {
                                  console.error(
                                    "Number already inserted to table Invalid_Numbers!"
                                  );
                                } else {
                                  console.log(
                                    "Record inserted to database successfully!"
                                  );
                                }
                              }
                            );
                        } else {
                          for (let key in response.data) {
                            if (response.data.hasOwnProperty(key)) {
                              const innerObj = response.data[key];
                              for (let innerKey in innerObj) {
                                if (
                                  innerObj.hasOwnProperty(innerKey) &&
                                  innerKey === "network"
                                ) {
                                  const dynamicAttrValue = innerObj[innerKey];
                                  if (
                                    dynamicAttrValue ==
                                      "Sinch Voice-NSR-10X/1" ||
                                    dynamicAttrValue ==
                                      "BANDWIDTH.COM-NSR-10X/1"
                                  ) {
                                    console.log(
                                      "NUMBER FROM " +
                                        dynamicAttrValue +
                                        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                    );

                                    pool
                                      .request()
                                      .query(
                                        "INSERT INTO FlashCall.dbo.BlackListed_Phones (PhoneNumber, NetworkName, Assigned, PhoneType, Ported)VALUES (" +
                                          numbers[i] +
                                          ", N'" +
                                          dynamicAttrValue +
                                          "', N'" +
                                          thisAssigned +
                                          "', N'" +
                                          thisPhoneType +
                                          "', N'" +
                                          thisported +
                                          "');",
                                        (err, result) => {
                                          if (err) {
                                            console.error(
                                              "Number Already in BlackList"
                                            );
                                          } else {
                                            console.log(
                                              "Record inserted to database successfully!"
                                            );
                                          }
                                        }
                                      );
                                    let timeStamp = currentDate.getTime();
                                    let dateFormat = new Date(
                                      timeStamp
                                    ).toLocaleString("en-US");
                                    console.log(dateFormat);
                                    pool
                                      .request()
                                      .query(
                                        "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                          numbers[i] +
                                          ", N'" +
                                          dynamicAttrValue +
                                          "', N'" +
                                          thisAssigned +
                                          "', N'" +
                                          thisPhoneType +
                                          "', N'" +
                                          thisported +
                                          "', N'VALID NUMBER', N'" +
                                          dateFormat +
                                          "');",
                                        (err, result) => {
                                          if (err) {
                                            console.error("err 3");
                                          } else {
                                            console.log(
                                              "Record inserted to database successfully!"
                                            );
                                          }
                                        }
                                      );
                                  } else {
                                    for (let key in response.data) {
                                      if (response.data.hasOwnProperty(key)) {
                                        const innerObj = response.data[key];
                                        for (let innerKey in innerObj) {
                                          if (
                                            innerObj.hasOwnProperty(innerKey) &&
                                            innerKey === "present"
                                          ) {
                                            const dynamicAttrValue =
                                              innerObj[innerKey];
                                            if (
                                              dynamicAttrValue == "no" ||
                                              dynamicAttrValue == "na"
                                            ) {
                                              console.log(
                                                "Number Not From Sinch & NOT ASSIGNED!!!!!!!!!!!!!"
                                              );
                                              let timeStamp =
                                                currentDate.getTime();
                                              let dateFormat = new Date(
                                                timeStamp
                                              ).toLocaleString("en-US");
                                              console.log(dateFormat);
                                              pool
                                                .request()
                                                .query(
                                                  "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                                    numbers[i] +
                                                    ", N'" +
                                                    thisNetworkName +
                                                    "', N'" +
                                                    thisAssigned +
                                                    "', N'" +
                                                    thisPhoneType +
                                                    "', N'" +
                                                    thisported +
                                                    "', N'VALID NUMBER', N'" +
                                                    dateFormat +
                                                    "');",
                                                  (err, result) => {
                                                    if (err) {
                                                      console.error("err 2");
                                                    } else {
                                                      console.log(
                                                        "Record inserted to database successfully!"
                                                      );
                                                    }
                                                  }
                                                );

                                              pool
                                                .request()
                                                .query(
                                                  "INSERT INTO FlashCall.dbo.Not_Assigned_Numbers (PhoneNumber)VALUES (" +
                                                    numbers[i] +
                                                    ");",
                                                  (err, result) => {
                                                    if (err) {
                                                      console.error(
                                                        "Already present at table Not_Assigned_Numbers!"
                                                      );
                                                    } else {
                                                      console.log(
                                                        "Record inserted to database successfully!"
                                                      );
                                                    }
                                                  }
                                                );
                                            } else {
                                              console.log(
                                                "Number Not From Sinch"
                                              );
                                              let timeStamp =
                                                currentDate.getTime();
                                              let dateFormat = new Date(
                                                timeStamp
                                              ).toLocaleString("en-US");
                                              console.log(dateFormat);
                                              pool
                                                .request()
                                                .query(
                                                  "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                                    numbers[i] +
                                                    ", N'" +
                                                    thisNetworkName +
                                                    "', N'" +
                                                    thisAssigned +
                                                    "', N'" +
                                                    thisPhoneType +
                                                    "', N'" +
                                                    thisported +
                                                    "', N'VALID NUMBER', N'" +
                                                    dateFormat +
                                                    "');",
                                                  (err, result) => {
                                                    if (err) {
                                                      console.error("err");
                                                    } else {
                                                      console.log(
                                                        "Record inserted to database successfully!"
                                                      );
                                                    }
                                                  }
                                                );
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              })
              .catch((error) => {
                console.log(error);
                console.error(error);
              });
          }
        });
      res.send("CHECK YOUR DATABASE.");
    });

    app.post("/uploadxlsx", upload.single("xlsxFile"), (req, res) => {
      // Lookup for range of number from csv file
      const results = [];
      const currentDate = new Date();
      const oldPath = req.file.path;
      // const newPath = `uploads/${req.file.originalname}`;
      const newPath = `uploads/xlsx.xlsx`;
      fs.rename(oldPath, newPath, (err) => {
        if (err) throw err;
        const workbook = xlsx.readFile(newPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(data);
        console.log("File uploaded and renamed!");
      });

      const workbook = xlsx.readFile("uploads/xlsx.xlsx");
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const desiredColumns = ["numbers"]; // put the names of the columns you want to extract here

      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      const headerRow = data[0];
      const columnIndices = desiredColumns.map((column) =>
        headerRow.indexOf(column)
      );

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowData = {};
        for (let j = 0; j < columnIndices.length; j++) {
          const columnIndex = columnIndices[j];
          const column = desiredColumns[j];
          rowData[column] = row[columnIndex];
        }
        results.push(rowData);
      }

      const numbers = results.map((number) => number.numbers);
      console.log("Looking up for " + results.length + " numbers");
      console.log("START");
      for (let i = 0; i < results.length; i++) {
        axios
          .get(
            //Key          //Secret
            "https://api.tmtvelocity.com/live/json/key/secret/" +
              numbers[i]
          )
          .then((response) => {
            console.log("Checking number " + i + ": " + numbers[i]);

            let thisNetworkName = undefined;
            let thisported = null;
            let thisAssigned = undefined;
            let thisPhoneType = undefined;

            for (let key in response.data) {
              if (response.data.hasOwnProperty(key)) {
                const innerObj = response.data[key];
                for (let innerKey in innerObj) {
                  if (
                    innerObj.hasOwnProperty(innerKey) &&
                    innerKey === "network"
                  ) {
                    const dynamicAttrValue = innerObj[innerKey];
                    thisNetworkName = dynamicAttrValue;
                  }
                }
              }
            }

            for (let key in response.data) {
              if (response.data.hasOwnProperty(key)) {
                const innerObj = response.data[key];
                for (let innerKey in innerObj) {
                  if (
                    innerObj.hasOwnProperty(innerKey) &&
                    innerKey === "type"
                  ) {
                    const dynamicAttrValue = innerObj[innerKey];
                    thisPhoneType = dynamicAttrValue;
                  }
                }
              }
            }

            for (let key in response.data) {
              if (response.data.hasOwnProperty(key)) {
                const innerObj = response.data[key];
                for (let innerKey in innerObj) {
                  if (
                    innerObj.hasOwnProperty(innerKey) &&
                    innerKey === "present"
                  ) {
                    const dynamicAttrValue = innerObj[innerKey];
                    thisAssigned = dynamicAttrValue;
                  }
                }
              }
            }

            for (let key in response.data) {
              if (response.data.hasOwnProperty(key)) {
                const innerObj = response.data[key];
                for (let innerKey in innerObj) {
                  if (
                    innerObj.hasOwnProperty(innerKey) &&
                    innerKey === "ported"
                  ) {
                    const dynamicAttrValue = innerObj[innerKey];
                    thisported = dynamicAttrValue;
                  }
                }
              }
            }

            for (let key in response.data) {
              if (response.data.hasOwnProperty(key)) {
                const innerObj = response.data[key];
                for (let innerKey in innerObj) {
                  if (
                    innerObj.hasOwnProperty(innerKey) &&
                    innerKey === "status_message"
                  ) {
                    const dynamicAttrValue = innerObj[innerKey];
                    if (dynamicAttrValue == "Invalid Number") {
                      res.send(
                        "NUMBER INVALID!\n FOR REFERENCE:\n" +
                          JSON.stringify(response.data)
                      );
                      console.log("NUMBER INVALID!");
                      let timeStamp = currentDate.getTime();
                      let dateFormat = new Date(timeStamp).toLocaleString(
                        "en-US"
                      );
                      console.log(dateFormat);
                      pool
                        .request()
                        .query(
                          "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                            numbers[i] +
                            ", N'na', N'na', N'na', N'na', N'INVALID NUMBER', N'" +
                            dateFormat +
                            "');",
                          (err, result) => {
                            if (err) {
                              console.error(err);
                            } else {
                              console.log(
                                "Record inserted to database successfully!"
                              );
                            }
                          }
                        );

                      pool
                        .request()
                        .query(
                          "INSERT INTO FlashCall.dbo.Invalid_Numbers (PhoneNumber)VALUES (" +
                            numbers[i] +
                            ");",
                          (err, result) => {
                            if (err) {
                              console.error(
                                "Number already inserted to table Invalid_Numbers!"
                              );
                            } else {
                              console.log(
                                "Record inserted to database successfully!"
                              );
                            }
                          }
                        );
                    } else {
                      for (let key in response.data) {
                        if (response.data.hasOwnProperty(key)) {
                          const innerObj = response.data[key];
                          for (let innerKey in innerObj) {
                            if (
                              innerObj.hasOwnProperty(innerKey) &&
                              innerKey === "network"
                            ) {
                              const dynamicAttrValue = innerObj[innerKey];
                              if (
                                dynamicAttrValue == "Sinch Voice-NSR-10X/1" ||
                                dynamicAttrValue == "BANDWIDTH.COM-NSR-10X/1"
                              ) {
                                console.log(
                                  "NUMBER FROM " +
                                    dynamicAttrValue +
                                    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                );

                                pool
                                  .request()
                                  .query(
                                    "INSERT INTO FlashCall.dbo.BlackListed_Phones (PhoneNumber, NetworkName, Assigned, PhoneType, Ported)VALUES (" +
                                      numbers[i] +
                                      ", N'" +
                                      dynamicAttrValue +
                                      "', N'" +
                                      thisAssigned +
                                      "', N'" +
                                      thisPhoneType +
                                      "', N'" +
                                      thisported +
                                      "');",
                                    (err, result) => {
                                      if (err) {
                                        console.error(
                                          "Number Already in BlackList"
                                        );
                                      } else {
                                        console.log(
                                          "Record inserted to database successfully!"
                                        );
                                      }
                                    }
                                  );

                                let timeStamp = currentDate.getTime();
                                let dateFormat = new Date(
                                  timeStamp
                                ).toLocaleString("en-US");
                                console.log(dateFormat);
                                pool
                                  .request()
                                  .query(
                                    "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                      numbers[i] +
                                      ", N'" +
                                      dynamicAttrValue +
                                      "', N'" +
                                      thisAssigned +
                                      "', N'" +
                                      thisPhoneType +
                                      "', N'" +
                                      thisported +
                                      "', N'VALID NUMBER', N'" +
                                      dateFormat +
                                      "');",
                                    (err, result) => {
                                      if (err) {
                                        console.error(err);
                                      } else {
                                        console.log(
                                          "Record inserted to database successfully!"
                                        );
                                      }
                                    }
                                  );
                              } else {
                                for (let key in response.data) {
                                  if (response.data.hasOwnProperty(key)) {
                                    const innerObj = response.data[key];
                                    for (let innerKey in innerObj) {
                                      if (
                                        innerObj.hasOwnProperty(innerKey) &&
                                        innerKey === "present"
                                      ) {
                                        const dynamicAttrValue =
                                          innerObj[innerKey];
                                        if (
                                          dynamicAttrValue == "no" ||
                                          dynamicAttrValue == "na"
                                        ) {
                                          console.log(
                                            "Number Not From Sinch & NOT ASSIGNED!!!!!!!!!!!!!"
                                          );
                                          let timeStamp = currentDate.getTime();
                                          let dateFormat = new Date(
                                            timeStamp
                                          ).toLocaleString("en-US");
                                          console.log(dateFormat);
                                          pool
                                            .request()
                                            .query(
                                              "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                                numbers[i] +
                                                ", N'" +
                                                thisNetworkName +
                                                "', N'" +
                                                dynamicAttrValue +
                                                "', N'" +
                                                thisPhoneType +
                                                "', N'" +
                                                thisported +
                                                "', N'VALID NUMBER', N'" +
                                                dateFormat +
                                                "');",
                                              (err, result) => {
                                                if (err) {
                                                  console.error(err);
                                                } else {
                                                  console.log(
                                                    "Record inserted to database successfully!"
                                                  );
                                                }
                                              }
                                            );

                                          pool
                                            .request()
                                            .query(
                                              "INSERT INTO FlashCall.dbo.Not_Assigned_Numbers (PhoneNumber)VALUES (" +
                                                numbers[i] +
                                                ");",
                                              (err, result) => {
                                                if (err) {
                                                  console.error(
                                                    "Already present at table Not_Assigned_Numbers!"
                                                  );
                                                } else {
                                                  console.log(
                                                    "Record inserted to database successfully!"
                                                  );
                                                }
                                              }
                                            );
                                        } else {
                                          console.log("Number Not From Sinch");
                                          let timeStamp = currentDate.getTime();
                                          let dateFormat = new Date(
                                            timeStamp
                                          ).toLocaleString("en-US");
                                          console.log(dateFormat);
                                          pool
                                            .request()
                                            .query(
                                              "INSERT INTO FlashCall.dbo.Lookup_History (PhoneNumber, NetworkName, Assigned, PhoneType, Ported, Validity, TimeStamp)VALUES (" +
                                                numbers[i] +
                                                ", N'" +
                                                thisNetworkName +
                                                "', N'" +
                                                thisAssigned +
                                                "', N'" +
                                                thisPhoneType +
                                                "', N'" +
                                                thisported +
                                                "', N'VALID NUMBER', N'" +
                                                dateFormat +
                                                "');",
                                              (err, result) => {
                                                if (err) {
                                                  console.error(err);
                                                } else {
                                                  console.log(
                                                    "Record inserted to database successfully!"
                                                  );
                                                }
                                              }
                                            );
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          })
          .catch((error) => {
            console.log(error);
            console.error(error);
          });
      }
      res.send("CHECK YOUR DATABASE.");
    });

    app.listen(3000, () => {
      console.log("Server started on port 3000...");
    });
  }
});
