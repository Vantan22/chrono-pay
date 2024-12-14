import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Typography,
  InputNumber,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useFirestore } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
import { useMessage } from "@/providers/MessageProvider";

const { Title } = Typography;
const { TextArea } = Input;

export const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();

  const { user } = useAuth();
  const { getAll, add, update, remove } = useFirestore("projects");
  const { handleError } = useError();
  const { showSuccess } = useMessage();

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const conditions = [
        {
          field: "userId",
          operator: "==",
          value: user.uid,
        },
      ];
      const data = await getAll(conditions);
      setProjects(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProject) {
        await update(editingProject.id, { ...values, userId: user.uid });
        showSuccess("Cập nhật dự án thành công!");
      } else {
        await add({ ...values, userId: user.uid, status: "active" });
        showSuccess("Thêm dự án thành công!");
      }
      setModalVisible(false);
      fetchProjects();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      showSuccess("Xóa dự án thành công!");
      fetchProjects();
    } catch (error) {
      handleError(error);
    }
  };

  const columns = [
    {
      title: "Tên dự án",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Số tiền/giờ",
      dataIndex: "hourlyRate",
      key: "hourlyRate",
      render: (rate) => `${Math.round(rate).toLocaleString()} VND`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Đang hoạt động" : "Đã kết thúc"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProject(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={4}>Quản lý dự án</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProject(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Thêm dự án
          </Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={projects}
          rowKey="id"
        />

        <Modal
          title={editingProject ? "Sửa dự án" : "Thêm dự án mới"}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Tên dự án"
              rules={[{ required: true, message: "Vui lòng nhập tên dự án" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="hourlyRate"
              label="Số tiền/giờ (VND)"
              rules={[{ required: true, message: "Vui lòng nhập số tiền/giờ" }]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `VND ${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/VND\s?|(,*)/g, "") || "0"}
              />
            </Form.Item>

            {editingProject && (
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value="active">Đang hoạt động</Select.Option>
                  <Select.Option value="inactive">Đã kết thúc</Select.Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={() => setModalVisible(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                  {editingProject ? "Cập nhật" : "Thêm mới"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};
