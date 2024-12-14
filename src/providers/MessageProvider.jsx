import { message } from "antd";
import { createContext, useContext } from "react";
import PropTypes from "prop-types";

const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const showError = (error) => {
    let errorMessage = `Lỗi: ${error}`;

    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Tài khoản không tồn tại";
          break;
        case "auth/wrong-password":
          errorMessage = "Sai mật khẩu";
          break;
        case "auth/email-already-in-use":
          errorMessage = "Email đã được sử dụng";
          break;
        case "auth/weak-password":
          errorMessage = "Mật khẩu quá yếu";
          break;
        case "auth/invalid-email":
          errorMessage = "Email không hợp lệ";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Vui lòng đăng nhập lại để thực hiện thao tác này";
          break;
        default:
          errorMessage = error.message;
      }
    }

    messageApi.error(errorMessage);
  };

  const showSuccess = (content) => {
    messageApi.success(content);
  };

  return (
    <MessageContext.Provider value={{ showError, showSuccess }}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};

MessageProvider.propTypes = {
  children: PropTypes.node,
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
}; 
