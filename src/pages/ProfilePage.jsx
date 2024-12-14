import { useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Divider,
  Form,
  Input,
  Button,
  Space,
  Modal,
  message,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from "firebase/auth";

const { Title, Text } = Typography;
const { confirm } = Modal;

export const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleUpdatePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      // Xác thực lại người dùng với mật khẩu hiện tại
      const credential = EmailAuthProvider.credential(
        user.email,
        values.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Cập nhật mật khẩu mới
      await updatePassword(user, values.newPassword);

      message.success("Cập nhật mật khẩu thành công!");
      form.resetFields();
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        message.error("Mật khẩu hiện tại không đúng!");
      } else {
        message.error("Lỗi cập nhật mật khẩu: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirm = () => {
    confirm({
      title: "Bạn có chắc chắn muốn xóa tài khoản?",
      icon: <ExclamationCircleFilled />,
      content: "Hành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xóa vĩnh viễn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: handleDeleteAccount,
    });
  };

  const handleDeleteAccount = async () => {
    try {
      // Xóa user từ Authentication
      await deleteUser(user);
      
      // Đăng xuất và chuyển hướng về trang login
      await logout();
      message.success("Tài khoản đã được xóa thành công");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        // Yêu cầu xác thực lại trước khi xóa tài khoản
        showReauthenticateModal();
      } else {
        message.error("Lỗi xóa tài khoản: " + error.message);
      }
    }
  };

  const showReauthenticateModal = () => {
    Modal.confirm({
      title: "Xác thực lại",
      content: (
        <Form>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu của bạn" />
          </Form.Item>
        </Form>
      ),
      async onOk(values) {
        try {
          const credential = EmailAuthProvider.credential(
            user.email,
            values.password
          );
          await reauthenticateWithCredential(user, credential);
          await handleDeleteAccount();
        } catch (error) {
          message.error("Mật khẩu không đúng!");
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            Thông tin tài khoản
          </Title>
          <Text type="secondary">{user?.email}</Text>
        </div>

        <Divider />

        <Title level={4}>
          <LockOutlined /> Đổi mật khẩu
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdatePassword}
          style={{ maxWidth: 400, margin: "24px auto" }}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp!")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Cập nhật mật khẩu
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: "center" }}>
          <Space direction="vertical">
            <Text type="secondary">Vùng nguy hiểm</Text>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={showDeleteConfirm}
            >
              Xóa tài khoản
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}; 
