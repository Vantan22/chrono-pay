import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Select,
  Table,
  Tag,
} from "antd";
import {
  ProjectOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Line, Column, Pie } from "@ant-design/plots";
import { useFirestore } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Title } = Typography;

const timeRanges = {
  week: { label: "7 ngày qua", days: 7 },
  month: { label: "30 ngày qua", days: 30 },
  quarter: { label: "90 ngày qua", days: 90 },
};

export const DashboardPage = () => {
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedRange, setSelectedRange] = useState("month");
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalHours: 0,
    totalIncome: 0,
    projectStats: [],
    dailyStats: [],
  });

  const { user } = useAuth();
  const projectStore = useFirestore("projects");
  const timeEntryStore = useFirestore("timeEntries");
  const { handleError } = useError();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedRange]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchProjects(), fetchTimeEntries()]);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchProjects = async () => {
    const conditions = [
      {
        field: "userId",
        operator: "==",
        value: user.uid,
      },
    ];
    const data = await projectStore.getAll(conditions);
    setProjects(data);
    return data;
  };

  const fetchTimeEntries = async () => {
    const startDate = dayjs().subtract(timeRanges[selectedRange].days, "day");
    const conditions = [
      {
        field: "userId",
        operator: "==",
        value: user.uid,
      },
      {
        field: "startTime",
        operator: ">=",
        value: startDate.toISOString(),
      },
    ];
    const data = await timeEntryStore.getAll(conditions);
    setTimeEntries(data);
    return data;
  };

  useEffect(() => {
    calculateStats();
  }, [projects, timeEntries]);

  const calculateStats = () => {
    const activeProjects = projects.filter((p) => p.status === "active");
    const projectStats = {};
    const dailyStats = {};
    let totalHours = 0;
    let totalIncome = 0;

    // Initialize daily stats
    for (let i = 0; i < timeRanges[selectedRange].days; i++) {
      const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      dailyStats[date] = { hours: 0, income: 0 };
    }

    timeEntries.forEach((entry) => {
      const project = projects.find((p) => p.id === entry.projectId);
      if (!project) return;

      const date = dayjs(entry.startTime).format("YYYY-MM-DD");
      const hours = entry.hours || 0;
      const income = hours * (project.hourlyRate || 0);

      // Update total stats
      totalHours += hours;
      totalIncome += income;

      // Update project stats
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

      // Update daily stats
      if (dailyStats[date]) {
        dailyStats[date].hours += hours;
        dailyStats[date].income += income;
      }
    });

    const dailyStatsArray = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    setStats({
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalHours,
      totalIncome,
      projectStats: Object.values(projectStats),
      dailyStats: dailyStatsArray,
    });
  };

  const columns = [
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Số giờ",
      dataIndex: "hours",
      key: "hours",
      render: (hours) => `${hours.toFixed(2)} giờ`,
    },
    {
      title: "Thu nhập",
      dataIndex: "income",
      key: "income",
      render: (income) => `${Math.round(income).toLocaleString()} VND`,
    },
  ];

  const lineConfig = {
    data: stats.dailyStats,
    xField: "date",
    yField: "hours",
    seriesField: "type",
    xAxis: {
      type: "time",
      label: {
        formatter: (v) => dayjs(v).format("DD/MM"),
      },
    },
    tooltip: {
      formatter: (data) => {
        return {
          name: "Số giờ",
          value: `${data.hours.toFixed(2)} giờ`,
        };
      },
    },
  };

  const columnConfig = {
    data: stats.dailyStats,
    xField: "date",
    yField: "income",
    xAxis: {
      label: {
        formatter: (v) => dayjs(v).format("DD/MM"),
      },
    },
    tooltip: {
      formatter: (data) => {
        return {
          name: "Thu nhập",
          value: `${Math.round(data.income).toLocaleString()} VND`,
        };
      },
    },
    color: "#1890ff",
  };

  const trendConfig = {
    data: stats.dailyStats,
    xField: 'date',
    yField: 'hours',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  const pieConfig = {
    data: stats.projectStats,
    angleField: 'hours',
    colorField: 'projectName',
    radius: 0.8,
    label: {
      type: 'outer',
    },
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4}>Tổng quan</Title>
        </Col>
        <Col>
          <Select
            value={selectedRange}
            onChange={setSelectedRange}
            style={{ width: 150 }}
          >
            {Object.entries(timeRanges).map(([key, { label }]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số dự án"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dự án đang hoạt động"
              value={stats.activeProjects}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số giờ"
              value={stats.totalHours.toFixed(2)}
              prefix={<ClockCircleOutlined />}
              suffix="giờ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng thu nhập"
              value={stats.totalIncome}
              prefix={<DollarOutlined />}
              formatter={(value) => `${Math.round(value).toLocaleString()} VND`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Thống kê giờ làm việc">
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Thống kê thu nhập">
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Top dự án">
            <Table
              columns={columns}
              dataSource={stats.projectStats
                .sort((a, b) => b.hours - a.hours)
                .slice(0, 5)}
              rowKey="projectName"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Xu hướng làm việc">
            <Line {...trendConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Phân bổ thời gian">
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
