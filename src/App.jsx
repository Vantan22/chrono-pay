import { ConfigProvider } from "antd";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import viVN from "antd/locale/vi_VN";
import { MessageProvider } from "@/providers/MessageProvider";

const App = () => {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          wireframe: false,
          colorPrimary: "#00b96b",
          colorInfo: "#00b96b",
          borderRadius: 6,
        },
      }}
    >
      <MessageProvider>
        <RouterProvider router={router} />
      </MessageProvider>
    </ConfigProvider>
  );
};

export default App;
