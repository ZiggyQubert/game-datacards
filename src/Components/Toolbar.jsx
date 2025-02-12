import {
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FolderAddOutlined,
  InboxOutlined,
  PrinterOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Col, Modal, Row, Tabs, Tooltip, message } from "antd";
import Dragger from "antd/lib/upload/Dragger";
import { compare } from "compare-versions";
import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useCardStorage } from "../Hooks/useCardStorage";
import { useFirebase } from "../Hooks/useFirebase";

import { Parser } from "xml2js";
import { Create40kRoster } from "../Helpers/battlescribe.40k.helpers";
import { useSettingsStorage } from "../Hooks/useSettingsStorage";

const parser = new Parser({ mergeAttrs: true, explicitArray: false });

const parseString = parser.parseString;

export const Toolbar = ({ selectedTreeKey, setSelectedTreeKey }) => {
  const { settings } = useSettingsStorage();
  const [uploadFile, setUploadFile] = React.useState(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const navigate = useNavigate();

  const { logScreenView } = useFirebase();

  const [fileList, setFileList] = React.useState([]);
  const { cardStorage, activeCategory, saveActiveCard, importCategory, cardUpdated, addCategory } = useCardStorage();

  function parseXML(xmldata) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmldata, "text/xml");
    if (!doc) return;

    // Determine roster type (game system).
    const info = doc.querySelector("roster");
    if (!info) return;

    const gameType = info.getAttribute("gameSystemName");
    if (!gameType) return;

    const rosterName = info.getAttribute("name");
    if (rosterName) {
      document.title = `FancyScribe ${rosterName}`;
    }

    if (gameType == "Warhammer 40,000 9th Edition") {
      console.log(doc);
      const roster = Create40kRoster(doc);
      console.log(roster);
      if (roster && roster.forces.length > 0) {
        // setRoster(roster);
        // setError("");
        // smartlook("track", "loadRoster", {
        //   name: rosterName,
        //   faction: roster.forces[0].catalog,
        // });
        setFileList([
          {
            uid: "-1",
            name: `${roster.name}`,
            status: "success",
            size: JSON.stringify(roster).length,
          },
        ]);
        setUploadFile(roster);
        return roster;
      }
    } else {
      // setError("No support for game type '" + gameType + "'.");
    }
  }

  return (
    <Row>
      <Col
        span={12}
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "start",
          background: "white",
          borderBottom: "1px solid #E5E5E5",
        }}>
        <Modal
          title="Import Game Datacards"
          visible={isModalVisible}
          okButtonProps={{ disabled: !uploadFile }}
          onOk={() => {
            if (compare(uploadFile.version, "0.4.0", "=")) {
              importCategory({
                uuid: uuidv4(),
                name: "Imported Cards",
                cards: uploadFile.cards,
              });
            }
            if (compare(uploadFile.version, "0.5.0", ">=") && compare(uploadFile.version, "1.2.0", "<=")) {
              importCategory({
                ...uploadFile.category,
                cards: uploadFile.category.cards.map((card) => {
                  return { ...card, source: "40k" };
                }),
              });
            }
            if (compare(uploadFile.version, "1.3.0", ">=")) {
              importCategory(uploadFile.category);
            }
            setFileList([]);
            setUploadFile(null);
            setIsModalVisible(false);
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setFileList([]);
            setUploadFile(null);
          }}>
          <Tabs>
            <Tabs.TabPane tab={"Game-datacards"} key={"game-datacards"} style={{ minHeight: 250 }}>
              <Row>
                <Col span={24}>
                  <Dragger
                    fileList={fileList}
                    multiple={false}
                    maxCount={1}
                    action={null}
                    accept={".json"}
                    itemRender={(node, file) => {
                      return file.status === "success" ? (
                        <Row
                          style={{
                            marginTop: "4px",
                            padding: "8px",
                            border: `1px solid #E5E5E5`,
                            borderRadius: 4,
                          }}
                          align={"middle"}
                          justify={"space-around"}>
                          <Col>
                            <FileOutlined style={{ fontSize: "18px" }} />
                          </Col>
                          <Col>{file.name}</Col>
                          <Col>{`${Math.round(file.size / 1024, 1)}KiB`}</Col>
                          <Col>
                            <Button
                              type={"text"}
                              shape={"circle"}
                              onClick={() => {
                                setFileList(null);
                                setUploadFile(null);
                              }}
                              icon={<DeleteOutlined />}
                            />
                          </Col>
                        </Row>
                      ) : (
                        <Tooltip title={"This file cannot be read as an Game Datacards export."} color={"red"}>
                          <Row
                            style={{
                              marginTop: "4px",
                              padding: "8px",
                              border: `1px solid red`,
                              borderRadius: 4,
                            }}
                            align={"middle"}
                            justify={"space-around"}>
                            <Col>
                              <FileOutlined style={{ fontSize: "18px" }} />
                            </Col>
                            <Col>{file.name}</Col>
                            <Col>{`${Math.round(file.size / 1024, 1)}KiB`}</Col>
                            <Col>
                              <Button
                                type={"text"}
                                shape={"circle"}
                                onClick={() => {
                                  setFileList(null);
                                  setUploadFile(null);
                                }}
                                icon={<DeleteOutlined />}
                              />
                            </Col>
                          </Row>
                        </Tooltip>
                      );
                    }}
                    beforeUpload={(file) => {
                      var reader = new FileReader();

                      reader.onload = function (event) {
                        try {
                          const importedJson = JSON.parse(event.target.result);
                          if (importedJson.website && importedJson.website === "https://game-datacards.eu") {
                            setFileList([
                              {
                                uid: "-1",
                                name: `${file.name} [ver. ${importedJson.version}]`,
                                status: "success",
                                size: file.size,
                              },
                            ]);
                            setUploadFile(importedJson);
                          } else {
                            setFileList([
                              {
                                uid: "-1",
                                name: file.name,
                                status: "error",
                                size: file.size,
                              },
                            ]);
                            setUploadFile(null);
                          }
                        } catch (e) {
                          setFileList([
                            {
                              uid: "-1",
                              name: file.name,
                              status: "error",
                              size: file.size,
                            },
                          ]);
                          setUploadFile(null);
                        }
                      };
                      reader.readAsText(file);

                      return false;
                    }}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag a file to this area to upload</p>
                    <p className="ant-upload-hint">Support for a single file upload. Only .json files.</p>
                  </Dragger>
                </Col>
              </Row>
            </Tabs.TabPane>
            {/* <Tabs.TabPane tab={"Battlescribe"} key={"battlescribe"} style={{ minHeight: 250 }}>
              <Row>
                <Col span={24}>
                  <Dragger
                    fileList={fileList}
                    multiple={false}
                    maxCount={1}
                    action={null}
                    accept={".rosz"}
                    itemRender={(node, file) => {
                      return file.status === "success" ? (
                        <Row
                          style={{
                            marginTop: "4px",
                            padding: "8px",
                            border: `1px solid #E5E5E5`,
                            borderRadius: 4,
                          }}
                          align={"middle"}
                          justify={"space-around"}>
                          <Col>
                            <FileOutlined style={{ fontSize: "18px" }} />
                          </Col>
                          <Col>{file.name}</Col>
                          <Col>{`${Math.round(file.size / 1024, 1)}KiB`}</Col>
                          <Col>
                            <Button
                              type={"text"}
                              shape={"circle"}
                              onClick={() => {
                                setFileList(null);
                                setUploadFile(null);
                              }}
                              icon={<DeleteOutlined />}
                            />
                          </Col>
                        </Row>
                      ) : (
                        <Tooltip title={"This file cannot be read as an battlescribe export."} color={"red"}>
                          <Row
                            style={{
                              marginTop: "4px",
                              padding: "8px",
                              border: `1px solid red`,
                              borderRadius: 4,
                            }}
                            align={"middle"}
                            justify={"space-around"}>
                            <Col>
                              <FileOutlined style={{ fontSize: "18px" }} />
                            </Col>
                            <Col>{file.name}</Col>
                            <Col>{`${Math.round(file.size / 1024, 1)}KiB`}</Col>
                            <Col>
                              <Button
                                type={"text"}
                                shape={"circle"}
                                onClick={() => {
                                  setFileList(null);
                                  setUploadFile(null);
                                }}
                                icon={<DeleteOutlined />}
                              />
                            </Col>
                          </Row>
                        </Tooltip>
                      );
                    }}
                    beforeUpload={(file) => {
                      var reader = new FileReader();

                      reader.onload = function (event) {
                        try {
                          JSZip.loadAsync(event.target.result).then(function (zip) {
                            for (let [filename, file] of Object.entries(zip.files)) {
                              file.async("text").then((text) => {
                                parseXML(text);
                              });
                            }
                          });
                        } catch (e) {
                          console.error(e);
                          setFileList([
                            {
                              uid: "-1",
                              name: file.name,
                              status: "error",
                              size: file.size,
                            },
                          ]);
                          setUploadFile(null);
                        }
                      };
                      reader.readAsArrayBuffer(file);

                      return false;
                    }}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag a file to this area to upload</p>
                    <p className="ant-upload-hint">Support for a single file upload. Only .rosz files.</p>
                  </Dragger>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form layout="horizontal">
                    <Card
                      type={"inner"}
                      size={"small"}
                      title={"Combine all models in a unit to one datacard."}
                      bodyStyle={{ padding: 0 }}
                      style={{ marginBottom: "8px", marginTop: "8px" }}
                      extra={<Switch />}
                    />
                    <Card
                      type={"inner"}
                      size={"small"}
                      title={"Add wound brackets to units"}
                      bodyStyle={{ padding: 0 }}
                      style={{ marginBottom: "8px", marginTop: "8px" }}
                      extra={<Switch />}
                    />
                  </Form>
                </Col>
              </Row>
            </Tabs.TabPane> */}
          </Tabs>
        </Modal>
        <Tooltip title={"Print cards from category"} placement="bottomLeft">
          <Button
            type={"text"}
            shape={"circle"}
            disabled={!(activeCategory && activeCategory.cards.length > 0)}
            onClick={() => {
              const categoryIndex = cardStorage?.categories?.findIndex((cat) => cat.uuid === activeCategory.uuid);
              logScreenView("Print");
              if (settings.legacyPrinting) {
                navigate(`/legacy-print/${categoryIndex}`);
              } else {
                navigate(`/print/${categoryIndex}`);
              }
            }}
            icon={<PrinterOutlined />}
          />
        </Tooltip>
        <Tooltip title={"Export category to JSON"} placement="bottomLeft">
          <Button
            type={"text"}
            shape={"circle"}
            disabled={!(activeCategory && activeCategory.cards.length > 0)}
            onClick={() => {
              logScreenView("Export Category");
              const exportCategory = {
                ...activeCategory,
                closed: false,
                uuid: uuidv4(),
                cards: activeCategory.cards.map((card) => {
                  return { ...card, uuid: uuidv4() };
                }),
              };
              const exportData = {
                category: exportCategory,
                createdAt: new Date().toISOString(),
                version: process.env.REACT_APP_VERSION,
                website: "https://game-datacards.eu",
              };
              const url = window.URL.createObjectURL(
                new Blob([JSON.stringify(exportData, null, 2)], {
                  type: "application/json",
                })
              );
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `${activeCategory.name}-${new Date().toISOString()}.json`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            icon={<DownloadOutlined />}
          />
        </Tooltip>
        <Tooltip title={"Import category from JSON"} placement="bottomLeft">
          <Button
            type={"text"}
            shape={"circle"}
            icon={<UploadOutlined />}
            onClick={() => {
              logScreenView("Import Category");
              setIsModalVisible(true);
            }}
          />
        </Tooltip>
        <Tooltip title={"Add new category"} placement="bottomLeft">
          <Button
            type={"text"}
            shape={"circle"}
            icon={<FolderAddOutlined />}
            onClick={() => {
              addCategory("New Category");
            }}
          />
        </Tooltip>
      </Col>
      <Col
        span={12}
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "end",
          background: "white",
          borderBottom: "1px solid #E5E5E5",
          alignItems: "center",
          paddingRight: "4px",
        }}>
        {selectedTreeKey && selectedTreeKey.includes("card") && (
          <>
            <Tooltip title={"Update selected card"} placement="bottom">
              <Button
                icon={<SaveOutlined />}
                type={"ghost"}
                size={"small"}
                disabled={!cardUpdated}
                onClick={() => {
                  saveActiveCard();
                  message.success("Card has been updated");
                }}>
                save
              </Button>
            </Tooltip>
          </>
        )}
      </Col>
    </Row>
  );
};
