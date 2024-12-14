import { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, theme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ProjectOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Tổng quan",
    path: "/dashboard",
  },
  {
    key: "projects",
    icon: <ProjectOutlined />,
    label: "Dự án",
    path: "/projects",
  },
  {
    key: "tasks",
    icon: <ScheduleOutlined />,
    label: "Công việc",
    path: "/tasks",
  },
  {
    key: "timesheet",
    icon: <ClockCircleOutlined />,
    label: "Chấm công",
    path: "/timesheet",
  },
  {
    key: "income",
    icon: <DollarOutlined />,
    label: "Thu nhập",
    path: "/income",
  },
];

export const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    const menuItem = menuItems.find((item) => item.key === key);
    if (menuItem) {
      navigate(menuItem.path);
    }
  };

  const handleUserMenuClick = async ({ key }) => {
    if (key === "logout") {
      try {
        await logout();
        navigate("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    } else if (key === "profile") {
      navigate("/profile");
    } else if (key === "settings") {
      navigate("/settings");
    }
  };

  const selectedKeys = menuItems
    .filter((item) => location.pathname.startsWith(item.path))
    .map((item) => item.key);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? true : collapsed}
        theme="light"
        style={{
          boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
          display: isMobile && !collapsed ? 'none' : 'block'
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "32px",
              width: "auto",
            }}
          />
          <span
            style={{
              color: "#00b96b",
              fontSize: "24px",
              marginLeft: "8px",
              fontWeight: "bold",
            }}
          >
            ChronoPay
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            boxShadow: "0 2px 8px 0 rgba(29,35,41,.05)",
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <div style={{ paddingRight: 24 }}>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Avatar icon={<UserOutlined />} />
                <span style={{ 
                  display: isMobile ? "none" : "inline-block", 
                  padding: "0 8px" 
                }}>
                  {user?.email}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? "16px" : "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflowX: "auto"
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
