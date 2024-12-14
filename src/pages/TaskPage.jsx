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
  Descriptions,
  notification,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useFirestore } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
import { useMessage } from "@/providers/MessageProvider";
import { useInterval } from "@/hooks/useInterval";
import dayjs from "dayjs";

const { Title } = Typography;
const { TextArea } = Input;

const taskStatus = {
  pending: { color: "warning", label: "Chờ xử lý" },
  inProgress: { color: "processing", label: "Đang thực hiện" },
  completed: { color: "success", label: "Hoàn thành" },
  cancelled: { color: "error", label: "Đã hủy" },
};

export const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [selectedTags, setSelectedTags] = useState([]);

  const { user } = useAuth();
  const taskStore = useFirestore("tasks");
  const projectStore = useFirestore("projects");
  const timeEntryStore = useFirestore("timeEntries");
  const { handleError } = useError();
  const { showSuccess } = useMessage();

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    if (!user?.uid) return;

    try {
      const conditions = [
        {
          field: "userId",
          operator: "==",
          value: user.uid,
        },
        {
          field: "status",
          operator: "==",
          value: "active",
        },
      ];
      const data = await projectStore.getAll(conditions);
      setProjects(data);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchTasks = async () => {
    if (!user?.uid || !selectedProject) return;

    setLoading(true);
    try {
      const conditions = [
        {
          field: "userId",
          operator: "==",
          value: user.uid,
        },
        {
          field: "projectId",
          operator: "==",
          value: selectedProject,
        },
      ];
      const data = await taskStore.getAll(conditions);

      // Fetch actual hours for each task
      const tasksWithActualHours = await Promise.all(
        data.map(async (task) => {
          const timeEntryConditions = [
            {
              field: "userId",
              operator: "==",
              value: user.uid,
            },
            {
              field: "taskId",
              operator: "==",
              value: task.id,
            },
          ];
          const timeEntries = await timeEntryStore.getAll(timeEntryConditions);
          
          // Calculate total hours from time entries
          const totalHours = timeEntries.reduce((sum, entry) => {
            return sum + (entry.hours || 0);
          }, 0);

          const hoursDiff = +(totalHours - task.estimatedHours).toFixed(2);

          return {
            ...task,
            actualHours: +totalHours.toFixed(2),
            hoursDiff
          };
        })
      );

      setTasks(tasksWithActualHours);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const taskData = {
        ...values,
        userId: user.uid,
        projectId: selectedProject,
      };

      if (editingTask) {
        await taskStore.update(editingTask.id, taskData);
        showSuccess("Cập nhật công việc thành công!");
      } else {
        await taskStore.add({ ...taskData, status: "pending" });
        showSuccess("Thêm công việc thành công!");
      }
      setModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskStore.remove(id);
      showSuccess("Xóa công việc thành công!");
      fetchTasks();
    } catch (error) {
      handleError(error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskStore.update(taskId, { status: newStatus });
      showSuccess("Cập nhật trạng thái thành công!");
      fetchTasks();
    } catch (error) {
      handleError(error);
    }
  };

  const columns = [
    {
      title: "Tên công việc",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số giờ dự kiến",
      dataIndex: "estimatedHours",
      key: "estimatedHours",
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
    {
      title: "Số giờ thực tế",
      dataIndex: "actualHours",
      key: "actualHours",
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
    {
      title: "Chênh lệch",
      dataIndex: "hoursDiff",
      key: "hoursDiff",
      render: (diff) => (
        <Space>
          {diff > 0 ? (
            <ArrowUpOutlined style={{ color: "#cf1322" }} />
          ) : diff < 0 ? (
            <ArrowDownOutlined style={{ color: "#3f8600" }} />
          ) : null}
          {`${Math.abs(diff || 0).toFixed(2)} giờ`}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 140 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          dropdownMatchSelectWidth={false}
        >
          {Object.entries(taskStatus).map(([key, { label, color }]) => (
            <Select.Option key={key} value={key}>
              <Tag color={color}>{label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTask(record);
              setDetailModalVisible(true);
            }}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTask(record);
              form.setFieldsValue({
                ...record,
              });
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

  const checkDeadlines = () => {
    const now = dayjs();
    tasks.forEach(task => {
      if (task.status === "inProgress" && task.dueDate) {
        const dueDate = dayjs(task.dueDate);
        const hoursLeft = dueDate.diff(now, 'hour');
        
        if (hoursLeft <= 24 && hoursLeft > 0) {
          notification.warning({
            message: "Sắp đến deadline",
            description: `Task "${task.name}" sẽ hết hạn trong ${hoursLeft} giờ nữa`,
            duration: 0
          });
        }
      }
    });
  };

  useInterval(checkDeadlines, 3600000);

  const filteredTasks = tasks.filter(task => {
    if (selectedTags.length === 0) return true;
    return task.tags?.some(tag => selectedTags.includes(tag));
  });

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
          <Space>
            <Title level={4}>Quản lý công việc</Title>
            <Select
              style={{ width: 200 }}
              placeholder="Chọn dự án"
              value={selectedProject}
              onChange={setSelectedProject}
              dropdownMatchSelectWidth={false}
            >
              {projects.map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (!selectedProject) {
                handleError("Vui lòng chọn dự án trước khi thêm công việc");
                return;
              }
              setEditingTask(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Thêm công việc
          </Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
        />

        <Modal
          title={editingTask ? "Sửa công việc" : "Thêm công việc mới"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingTask(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Tên công việc"
              rules={[
                { required: true, message: "Vui lòng nhập tên công việc" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="estimatedHours"
              label="Số giờ dự kiến"
              rules={[
                { required: true, message: "Vui lòng nhập số giờ dự kiến" },
              ]}
            >
              <InputNumber
                min={0.1}
                step={0.1}
                precision={2}
                style={{ width: "100%" }}
              />
            </Form.Item>

            {editingTask && (
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Select dropdownMatchSelectWidth={false}>
                  {Object.entries(taskStatus).map(([key, { label, color }]) => (
                    <Select.Option key={key} value={key}>
                      <Tag color={color}>{label}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item name="tags" label="Tags">
              <Select mode="tags" style={{ width: '100%' }}>
                <Select.Option value="urgent">Gấp</Select.Option>
                <Select.Option value="bug">Lỗi</Select.Option>
                <Select.Option value="feature">Tính năng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setEditingTask(null);
                    form.resetFields();
                  }}
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingTask ? "Cập nhật" : "Thêm mới"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Chi tiết công việc"
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setSelectedTask(null);
          }}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Đóng
            </Button>,
          ]}
        >
          {selectedTask && (
            <Descriptions column={1}>
              <Descriptions.Item label="Tên công việc">
                {selectedTask.name}
              </Descriptions.Item>
              <Descriptions.Item label="Dự án">
                {projects.find((p) => p.id === selectedTask.projectId)?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {selectedTask.description || "Không có mô tả"}
              </Descriptions.Item>
              <Descriptions.Item label="Số giờ dự kiến">
                {selectedTask.estimatedHours.toFixed(2)} giờ
              </Descriptions.Item>
              <Descriptions.Item label="Số giờ thực tế">
                {selectedTask.actualHours.toFixed(2)} giờ
              </Descriptions.Item>
              <Descriptions.Item label="Chênh lệch">
                <Space>
                  {selectedTask.hoursDiff > 0 ? (
                    <ArrowUpOutlined style={{ color: "#cf1322" }} />
                  ) : selectedTask.hoursDiff < 0 ? (
                    <ArrowDownOutlined style={{ color: "#3f8600" }} />
                  ) : null}
                  {`${Math.abs(selectedTask.hoursDiff || 0).toFixed(2)} giờ`}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={taskStatus[selectedTask.status].color}>
                  {taskStatus[selectedTask.status].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Card>
    </div>
  );
};
