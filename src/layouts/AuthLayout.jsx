import { Layout, Row, Col, Image, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import logo from "@/assets/logo.png";

const { Content } = Layout;
const { Title, Text } = Typography;

// eslint-disable-next-line react/prop-types
export const AuthLayout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content>
        <Row
          justify="center"
          align="middle"
          style={{ minHeight: "100vh", padding: "2rem" }}
        >
          <Col xs={24} md={20} lg={18} xl={16}>
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} md={12}>
                <div style={{ textAlign: "center" }}>
                  <Image
                    src={logo}
                    alt="ChronoPay Logo"
                    preview={false}
                    style={{
                      maxWidth: "200px",
                      marginBottom: "2rem",
                    }}
                  />
                  <Title
                    level={2}
                    style={{ color: "#00b96b", marginBottom: "1rem" }}
                  >
                    Chào mừng đến với ChronoPay
                  </Title>
                  <Text type="secondary" style={{ fontSize: "16px" }}>
                    Quản lý thời gian và thu nhập của bạn một cách hiệu quả
                  </Text>
                </div>
              </Col>

              {/* Right side - Auth form */}
              <Col xs={24} md={12}>
                <div
                  style={{
                    background: "#fff",
                    padding: "2rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {children}
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};
