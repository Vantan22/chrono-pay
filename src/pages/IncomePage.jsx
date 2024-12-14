import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Space,
  Typography,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Button,
} from "antd";
import {
  DollarOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useFirestore } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const IncomePage = () => {
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalIncome: 0,
    projectStats: [],
  });

  const { user } = useAuth();
  const projectStore = useFirestore("projects");
  const timeEntryStore = useFirestore("timeEntries");
  const { handleError } = useError();

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    fetchTimeEntries();
  }, [selectedProject, dateRange]);

  const fetchProjects = async () => {
    if (!user?.uid) return;

    try {
      const conditions = [
        {
          field: "userId",
          operator: "==",
          value: user.uid,
        },
      ];
      const data = await projectStore.getAll(conditions);
      setProjects(data);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchTimeEntries = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      let conditions = [
        {
          field: "userId",
          operator: "==",
          value: user.uid,
        },
        {
          field: "startTime",
          operator: ">=",
          value: dateRange[0].toISOString(),
        },
        {
          field: "startTime",
          operator: "<=",
          value: dateRange[1].toISOString(),
        },
      ];

      if (selectedProject) {
        conditions.push({
          field: "projectId",
          operator: "==",
          value: selectedProject,
        });
      }

      const data = await timeEntryStore.getAll(conditions);
      setTimeEntries(data);
      calculateStats(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entries) => {
    const projectStats = {};
    let totalHours = 0;
    let totalIncome = 0;

    entries.forEach((entry) => {
      const project = projects.find((p) => p.id === entry.projectId);
      if (!project) return;

      const hours = entry.hours || 0;
      const income = hours * (project.hourlyRate || 0);

      totalHours += hours;
      totalIncome += income;

      if (!projectStats[project.id]) {
        projectStats[project.id] = {
          projectName: project.name,
          hours: 0,
          income: 0,
          hourlyRate: project.hourlyRate,
        };
      }

      projectStats[project.id].hours += hours;
      projectStats[project.id].income += income;
    });

    setStats({
      totalHours,
      totalIncome,
      projectStats: Object.values(projectStats),
    });
  };

  const columns = [
    {
      title: "Dự án",
      key: "projectName",
      dataIndex: "projectName",
    },
    {
      title: "Số giờ",
      dataIndex: "hours",
      key: "hours",
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
    {
      title: "Rate/giờ",
      dataIndex: "hourlyRate",
      key: "hourlyRate",
      render: (rate) => `${rate.toLocaleString()} VND`,
    },
    {
      title: "Thu nhập",
      dataIndex: "income",
      key: "income",
      render: (income) => `${Math.round(income).toLocaleString()} VND`,
    },
  ];

  const timeEntryColumns = [
    {
      title: "Dự án",
      key: "projectId",
      render: (_, record) => {
        const project = projects.find((p) => p.id === record.projectId);
        return project?.name || "N/A";
      },
    },
    {
      title: "Ngày",
      dataIndex: "startTime",
      key: "startTime",
      render: (startTime) => dayjs(startTime).format("DD/MM/YYYY"),
    },
    {
      title: "Số giờ",
      dataIndex: "hours",
      key: "hours",
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
    {
      title: "Thu nhập",
      key: "income",
      render: (_, record) => {
        const project = projects.find((p) => p.id === record.projectId);
        const income = (record.hours || 0) * (project?.hourlyRate || 0);
        return `${Math.round(income).toLocaleString()} VND`;
      },
    },
  ];

  const handleExport = () => {
    const detailData = timeEntries.map(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      return {
        "Ngày": dayjs(entry.startTime).format("DD/MM/YYYY"),
        "Dự án": project?.name || "N/A",
        "Số giờ": entry.hours,
        "Rate/giờ": project?.hourlyRate || 0,
        "Thu nhập": (entry.hours || 0) * (project?.hourlyRate || 0)
      };
    });

    const summaryData = stats.projectStats.map(stat => ({
      "Dự án": stat.projectName,
      "Tổng số giờ": stat.hours,
      "Rate/giờ": stat.hourlyRate,
      "Tổng thu nhập": stat.income
    }));

    const wb = XLSX.utils.book_new();
    
    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, wsDetail, "Chi tiết");
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng hợp");
    
    XLSX.writeFile(wb, `bao-cao-thu-nhap-${dayjs().format("MM-YYYY")}.xlsx`);
  };

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Row gutter={16} align="middle">
            <Col>
              <Title level={4}>Thống kê thu nhập</Title>
            </Col>
            <Col flex="auto">
              <Space>
                <Select
                  style={{ width: 200 }}
                  placeholder="Chọn dự án"
                  allowClear
                  value={selectedProject}
                  onChange={setSelectedProject}
                >
                  {projects.map((project) => (
                    <Select.Option key={project.id} value={project.id}>
                      {project.name}
                    </Select.Option>
                  ))}
                </Select>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/YYYY"
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng số giờ"
                  value={stats.totalHours.toFixed(2)}
                  suffix="giờ"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng thu nhập"
                  value={stats.totalIncome}
                  formatter={(value) => `${value.toLocaleString()} VND`}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Số dự án"
                  value={stats.projectStats.length}
                  prefix={<ProjectOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Thống kê theo dự án">
            <Table
              loading={loading}
              columns={columns}
              dataSource={stats.projectStats}
              rowKey="projectName"
              pagination={false}
            />
          </Card>

          <Card title="Chi tiết thời gian làm việc">
            <Table
              loading={loading}
              columns={timeEntryColumns}
              dataSource={timeEntries}
              rowKey="id"
            />
          </Card>

          <Button 
            icon={<ExportOutlined />} 
            onClick={handleExport}
            style={{ marginLeft: 16 }}
          >
            Xuất báo cáo
          </Button>
        </Space>
      </Card>
    </div>
  );
}; 
