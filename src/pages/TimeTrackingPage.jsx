import { useState, useEffect, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  Typography,
  InputNumber,
  Row,
  Col,
  Descriptions,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useFirestore } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
import { useMessage } from "@/providers/MessageProvider";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const { Title, Text } = Typography;

export const TimeTrackingPage = () => {
  // States
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const [form] = Form.useForm();

  // Hooks
  const { user } = useAuth();
  const projectStore = useFirestore("projects");
  const taskStore = useFirestore("tasks");
  const timeEntryStore = useFirestore("timeEntries");
  const { handleError } = useError();
  const { showSuccess } = useMessage();

  // Effects
  useEffect(() => {
    fetchProjects();
    fetchTimeEntries();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  // Data fetching functions
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
        {
          field: "status",
          operator: "in",
          value: ["pending", "inProgress"],
        },
      ];
      const data = await taskStore.getAll(conditions);
      setTasks(data);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchTimeEntries = async () => {
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
      const sortBy = {
        field: "startTime",
        direction: "desc",
      };
      const data = await timeEntryStore.getAll(conditions, sortBy);

      // Fetch all tasks for time entries
      const uniqueProjectIds = [
        ...new Set(data.map((entry) => entry.projectId)),
      ];
      const tasksPromises = uniqueProjectIds.map((projectId) => {
        return taskStore.getAll([
          {
            field: "userId",
            operator: "==",
            value: user.uid,
          },
          {
            field: "projectId",
            operator: "==",
            value: projectId,
          },
        ]);
      });

      const allTasks = (await Promise.all(tasksPromises)).flat();

      // Add task data to time entries
      const entriesWithTaskData = data.map((entry) => ({
        ...entry,
        taskData: allTasks.find((task) => task.id === entry.taskId),
      }));

      setTimeEntries(entriesWithTaskData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleStartTracking = () => {
    if (!selectedTask) {
      handleError("Vui lòng chọn công việc trước khi bắt đầu");
      return;
    }
    setIsTracking(true);
  };

  const handleStopTracking = async () => {
    try {
      const duration = elapsedTime / 3600; // Convert seconds to hours
      await addTimeEntry(duration);
      setIsTracking(false);
      setElapsedTime(0);
      showSuccess("Đã lưu thời gian làm việc");
    } catch (error) {
      handleError(error);
    }
  };

  const handleManualEntry = async (values) => {
    if (!selectedProject || !selectedTask) {
      handleError("Vui lòng chọn dự án và công việc trước khi nhập thời gian");
      return;
    }
    try {
      await addTimeEntry(values.hours);
      setModalVisible(false);
      form.resetFields();
      showSuccess("Đã thêm thời gian làm việc");
    } catch (error) {
      handleError(error);
    }
  };

  const addTimeEntry = async (hours) => {
    const timeEntry = {
      userId: user.uid,
      projectId: selectedProject,
      taskId: selectedTask,
      hours,
      startTime: new Date().toISOString(),
    };

    await timeEntryStore.add(timeEntry);
    fetchTimeEntries();
  };

  // Table columns
  const columns = [
    {
      title: "Dự án",
      key: "projectId",
      render: (_, record) => {
        const project = projects.find((p) => p.id === record.projectId);
        return project?.name || "N/A";
      },
    },
    {
      title: "Công việc",
      key: "taskId",
      render: (_, record) => {
        return record.taskData?.name || "N/A";
      },
    },
    {
      title: "Thời gian",
      dataIndex: "hours",
      key: "hours",
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
    {
      title: "Ngày",
      dataIndex: "startTime",
      key: "startTime",
      render: (startTime) => dayjs(startTime).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Row gutter={[24, 24]} align="middle">
            <Col>
              <Title level={4}>Theo dõi thời gian</Title>
            </Col>

            <Col flex="auto">
              <Space size="middle">
                <Select
                  style={{ width: 240 }}
                  placeholder="Chọn dự án"
                  value={selectedProject}
                  onChange={(value) => {
                    setSelectedProject(value);
                    setSelectedTask(null);
                  }}
                >
                  {projects.map((project) => (
                    <Select.Option key={project.id} value={project.id}>
                      {project.name}
                    </Select.Option>
                  ))}
                </Select>

                <Select
                  style={{ width: 240 }}
                  placeholder="Chọn công việc"
                  value={selectedTask}
                  onChange={setSelectedTask}
                  disabled={!selectedProject}
                >
                  {tasks.map((task) => (
                    <Select.Option key={task.id} value={task.id}>
                      {task.name}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </Col>

            <Col>
              <Space size="middle">
                {isTracking ? (
                  <Button
                    type="primary"
                    danger
                    icon={<PauseCircleOutlined />}
                    onClick={handleStopTracking}
                    size="large"
                  >
                    Dừng
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartTracking}
                    size="large"
                  >
                    Bắt đầu
                  </Button>
                )}

                <Button
                  icon={<ClockCircleOutlined />}
                  onClick={() => {
                    if (!selectedProject || !selectedTask) {
                      handleError(
                        "Vui lòng chọn dự án và công việc trước khi nhập thời gian"
                      );
                      return;
                    }
                    setModalVisible(true);
                  }}
                  size="large"
                >
                  Nhập thủ công
                </Button>
              </Space>
            </Col>
          </Row>

          {isTracking && (
            <Card>
              <Descriptions title="Đang theo dõi" column={3}>
                <Descriptions.Item label="Dự án">
                  {projects.find((p) => p.id === selectedProject)?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Công việc">
                  {tasks.find((t) => t.id === selectedTask)?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian">
                  <Text strong>
                    {dayjs.duration(elapsedTime, "seconds").format("HH:mm:ss")}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Table
            loading={loading}
            columns={columns}
            dataSource={timeEntries}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Space>

        <Modal
          title="Nhập thời gian làm việc"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={480}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleManualEntry}
            style={{ marginTop: 24 }}
          >
            <Form.Item
              name="hours"
              label="Số giờ"
              rules={[
                { required: true, message: "Vui lòng nhập số giờ" },
                {
                  type: "number",
                  min: 0.1,
                  message: "Số giờ phải lớn hơn 0",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                step={0.5}
                precision={1}
                placeholder="Nhập số giờ làm việc"
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button size="large" onClick={() => setModalVisible(false)}>
                  Hủy
                </Button>
                <Button size="large" type="primary" htmlType="submit">
                  Lưu
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};
