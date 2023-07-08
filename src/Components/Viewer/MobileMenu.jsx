import { DatabaseOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Card, Col, Space, Switch, Typography, message } from "antd";
import React from "react";
import OutsideClickHandler from "react-outside-click-handler";
import { useDataSourceStorage } from "../../Hooks/useDataSourceStorage";
import { useSettingsStorage } from "../../Hooks/useSettingsStorage";

export const MobileMenu = ({ setIsVisible }) => {
  const [checkingForUpdate, setCheckingForUpdate] = React.useState(false);
  const { checkForUpdate } = useDataSourceStorage();
  const { settings, updateSettings } = useSettingsStorage();
  return (
    <>
      <div
        style={{
          display: "block",
          position: "absolute",
          height: "100vh",
          width: "100vw",
          backgroundColor: "#00000099",
          top: "0px",
          bottom: "0px",
          zIndex: 888,
        }}
      />
      <Col
        style={{
          display: "block",
          backgroundColor: "#001529",
          height: "auto",
          padding: "8px",
          paddingBottom: "64px",
          width: "100vw",
          position: "sticky",
          bottom: "0",
          zIndex: 999,
          borderTop: "2px solid #f0f2f5",
        }}
        className="mobile-menu">
        <OutsideClickHandler
          onOutsideClick={() => {
            setIsVisible(false);
          }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Text style={{ color: "white" }}>Options</Typography.Text>
            <Card
              type={"inner"}
              key={`display-01`}
              size={"small"}
              title={"Show Legend cards"}
              bodyStyle={{ padding: 0 }}
              style={{ marginBottom: "8px" }}
              extra={
                <Switch
                  checked={settings.showLegends}
                  onChange={(value) => {
                    updateSettings({ ...settings, showLegends: value });
                  }}
                />
              }></Card>
            <Typography.Text style={{ color: "white" }}>Actions</Typography.Text>
            <Button
              size="large"
              type="primary"
              block
              onClick={() => {
                setCheckingForUpdate(true);
                checkForUpdate().then(() => {
                  setCheckingForUpdate(false);
                  setIsVisible(false);
                  message.success({
                    content: "The datasource has been successfully updated.",
                    style: { marginTop: "10vh" },
                  });
                });
              }}
              icon={
                checkingForUpdate ? (
                  <LoadingOutlined style={{ color: "white" }} />
                ) : (
                  <DatabaseOutlined style={{ color: "white" }} />
                )
              }>
              Update datasources
            </Button>
          </Space>
        </OutsideClickHandler>
      </Col>
    </>
  );
};
