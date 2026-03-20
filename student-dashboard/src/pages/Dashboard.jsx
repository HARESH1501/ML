import React, { useMemo, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from "recharts";

const isHalfCreditSubject = (subject = "") => {
  const s = subject.toLowerCase();
  return s.includes("assembly") || s.includes("evs");
};

const getTotalMarksForSubject = (subject = "") =>
  isHalfCreditSubject(subject) ? 30 : 60;

const getPassThresholdForSubject = (subject = "") =>
  isHalfCreditSubject(subject) ? 15 : 30;

const PIE_COLORS = ["#28a745", "#ffc107", "#dc3545"];
const FAIL_DISTRIBUTION_COLORS = ["#ff6b6b", "#ffa94d", "#ffd93d", "#74c0fc", "#845ef7", "#868e96"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded shadow-sm px-3 py-2">
        <p className="fw-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="mb-0" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ students = [] }) {
  const [expandedStudentRoll, setExpandedStudentRoll] = useState(null);
  const [activeAnalysis, setActiveAnalysis] = useState({}); // { subject: categoryName }

  const handleChartInteraction = (subject, category) => {
    setActiveAnalysis(prev => ({
      ...prev,
      [subject]: prev[subject] === category ? null : category
    }));
  };

  const toggleStudent = (roll) => {
    setExpandedStudentRoll(prev => prev === roll ? null : roll);
  };

  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    return students.filter(student => {
      const roll = (student.roll || "").toLowerCase().trim();
      const rollMatch = roll.match(/(\d+)$/);
      if (!rollMatch) return false;

      const rollNumber = parseInt(rollMatch[1], 10);
      return !isNaN(rollNumber) && rollNumber <= 139;
    });
  }, [students]);

  const stats = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0) {
      return { totalStudents: 0, subjects: [], subjectStats: {} };
    }

    const firstStudent = filteredStudents[0] || {};
    const subjectKeys = Object.keys(firstStudent).filter(
      key => key !== "roll" && key !== "name"
    );

    const subjectStats = {};
    subjectKeys.forEach(subject => {
      const totalMarks = getTotalMarksForSubject(subject);
      const passThreshold = getPassThresholdForSubject(subject);
      const values = filteredStudents.map(student => student[subject]);
      const passCount = values.filter(v => typeof v === 'number' && v >= passThreshold).length;
      const failCount = values.filter(v => typeof v === 'number' && v >= 0 && v < passThreshold).length;
      const absentCount = values.filter(v => typeof v !== 'number').length;
      const highest = values.filter(v => typeof v === 'number').length ? Math.max(...values.filter(v => typeof v === 'number')) : 0;

      subjectStats[subject] = {
        totalMarks,
        passThreshold,
        passCount,
        failCount,
        absentCount,
        highest
      };
    });

    return {
      totalStudents: filteredStudents.length,
      subjects: subjectKeys,
      subjectStats
    };
  }, [filteredStudents]);

  const overallPassInfo = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0 || stats.subjects.length === 0) {
      return { passCount: 0, failCount: 0, passPercentage: 0, failPercentage: 0 };
    }

    const computedPassCount = filteredStudents.filter(student =>
      stats.subjects.every(subject => {
        const marks = student[subject];
        return typeof marks === 'number' && marks >= getPassThresholdForSubject(subject);
      })
    ).length;

    const finalPassCount = computedPassCount;
    const failCount = Math.max(filteredStudents.length - finalPassCount, 0);
    const passPercentage = filteredStudents.length
      ? Number(((finalPassCount / filteredStudents.length) * 100).toFixed(2))
      : 0;
    const failPercentage = filteredStudents.length ? Number((100 - passPercentage).toFixed(2)) : 0;

    return {
      passCount: finalPassCount,
      failCount,
      passPercentage,
      failPercentage
    };
  }, [filteredStudents, stats.subjects]);

  const topSubjectPieData = useMemo(() => {
    if (!stats.subjects.length) return [];
    return stats.subjects.slice(0, 5).map(subject => {
      const subjectStat = stats.subjectStats[subject];
      if (!subjectStat) return null;
      return {
        subject,
        highest: subjectStat.highest,
        totalMarks: subjectStat.totalMarks,
        passCount: subjectStat.passCount,
        failCount: subjectStat.failCount,
        absentCount: subjectStat.absentCount,
        pieData: [
          { name: "Pass", value: subjectStat.passCount },
          { name: "Fail", value: subjectStat.failCount },
          { name: "Absent", value: subjectStat.absentCount }
        ]
      };
    }).filter(Boolean);
  }, [stats.subjects, stats.subjectStats]);

  const overallPassFailData = useMemo(() => {
    if (!stats.totalStudents) return [];
    const failCount =
      typeof overallPassInfo.failCount === "number"
        ? overallPassInfo.failCount
        : Math.max(stats.totalStudents - overallPassInfo.passCount, 0);
    return [
      { name: "Passed All Subjects", value: overallPassInfo.passCount },
      { name: "At Least One Fail", value: failCount }
    ];
  }, [stats.totalStudents, overallPassInfo.passCount, overallPassInfo.failCount]);

  const failDistributionData = useMemo(() => {
    if (!filteredStudents.length || !stats.subjects.length) return [];

    const distribution = {};
    filteredStudents.forEach(student => {
      const failedSubjects = stats.subjects.reduce((count, subject) => {
        const marks = student[subject];
        const isFail = typeof marks !== 'number' || marks < getPassThresholdForSubject(subject);
        return isFail ? count + 1 : count;
      }, 0);

      if (failedSubjects === 0) return;
      distribution[failedSubjects] = (distribution[failedSubjects] || 0) + 1;
    });

    return Object.keys(distribution)
      .map(key => {
        const count = Number(key);
        return {
          failSubjects: count,
          name: `${count} subject${count === 1 ? "" : "s"} failed`,
          value: distribution[key]
        };
      })
      .sort((a, b) => a.failSubjects - b.failSubjects);
  }, [filteredStudents, stats.subjects]);

  const top3Students = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0 || stats.subjects.length === 0) return [];

    const studentsWithTotal = filteredStudents.map(student => {
      let total = 0;
      stats.subjects.forEach(subject => {
        total += Number(student[subject]) || 0;
      });
      return { ...student, totalMarks: total };
    });

    return studentsWithTotal.sort((a, b) => b.totalMarks - a.totalMarks).slice(0, 3);
  }, [filteredStudents, stats.subjects]);

  const manualArrearData = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0 || stats.subjects.length === 0) return { chartData: [], failedStudentsList: [] };

    const distribution = {};
    const failedStudentsList = [];

    filteredStudents.forEach(student => {
      const failedSubjects = [];
      stats.subjects.forEach(subject => {
        const marks = student[subject];
        if (typeof marks !== 'number' || marks < getPassThresholdForSubject(subject)) {
          failedSubjects.push(subject);
        }
      });

      const arrearCount = failedSubjects.length;
      if (arrearCount > 0) {
        distribution[arrearCount] = (distribution[arrearCount] || 0) + 1;
        failedStudentsList.push({
          ...student,
          arrearCount,
          failedSubjects
        });
      }
    });

    const chartData = Object.keys(distribution)
      .map(key => ({
        failSubjects: Number(key),
        name: `${key} arrear${Number(key) === 1 ? "" : "s"}`,
        value: distribution[key]
      }))
      .sort((a, b) => a.failSubjects - b.failSubjects);

    return { chartData, failedStudentsList: failedStudentsList.sort((a, b) => b.arrearCount - a.arrearCount) };
  }, [filteredStudents, stats.subjects]);

  if (!filteredStudents || filteredStudents.length === 0) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning shadow-sm mb-0">
          Unable to display analytics because no student records were loaded from the Excel sheet.
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Subject-wise Analysis</h2>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small mb-2">Total Students</h6>
              <h2 className="mb-0 text-primary">{stats.totalStudents}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small mb-2">Total Subjects</h6>
              <h2 className="mb-0 text-info">{stats.subjects.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small mb-2">Students Passed All Subjects</h6>
              <h2 className="mb-1 text-success">
                {overallPassInfo.passCount}
                <span className="text-muted fs-5"> / {stats.totalStudents}</span>
              </h2>
              <p className="text-muted small mb-0">
                Students passed in all the subjects
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small mb-2">At Least One Subject Failed</h6>
              <h2 className="mb-1 text-warning">
                {overallPassInfo.failCount}
                <span className="text-muted fs-5"> / {stats.totalStudents}</span>
              </h2>
              <p className="text-muted small mb-0">Students who failed at least one subject</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Overall Pass vs Fail</h5>
              {overallPassFailData.length === 0 ? (
                <div className="alert alert-info mb-0">No student data available.</div>
              ) : (
                <>
                  <div style={{ height: "360px" }}>
                    <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={overallPassFailData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="45%"
                              outerRadius="70%"
                              paddingAngle={4}
                              label={false}
                              onClick={(data) => handleChartInteraction('overall', data.name)}
                              style={{ cursor: 'pointer' }}
                            >
                              {overallPassFailData.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.name.includes("Passed") ? "#28a745" : "#ffc107"}
                                  opacity={
                                    activeAnalysis['overall'] && activeAnalysis['overall'] !== entry.name
                                      ? 0.3
                                      : 1
                                  }
                                />
                              ))}
                            </Pie>
                            <Legend 
                              wrapperStyle={{ cursor: 'pointer' }} 
                              onClick={(d) => handleChartInteraction('overall', d.value)} 
                            />
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-3">
                    <div className="d-flex justify-content-center gap-4 flex-wrap">
                      <div className="text-success fw-semibold">
                        Pass: {overallPassInfo.passPercentage.toFixed(2)}%
                      </div>
                      <div className="text-danger fw-semibold">
                        Fail: {overallPassInfo.failPercentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <h5 className="card-title mb-1">Subject-wise Pass / Fail / Absent (Top 5 Subjects)</h5>
                  <p className="text-muted small mb-0">
                    Each pie chart shows pass, fail, and absent counts; highest mark is shown under the chart.
                  </p>
                </div>
              </div>

              {topSubjectPieData.length === 0 ? (
                <div className="alert alert-info mb-0">Subject data is unavailable.</div>
              ) : (
                <div className={`row g-4 ${topSubjectPieData.length === 1 ? "justify-content-center" : ""}`}>
                  {topSubjectPieData.map(subjectInfo => {
                    const columnClass = topSubjectPieData.length === 1
                      ? "col-12 col-md-8 col-xl-6"
                      : "col-12 col-md-6 col-xl-4";

                    return (
                      <div className={columnClass} key={subjectInfo.subject}>
                        <div className="border rounded h-100 p-3 shadow-sm bg-white">
                          <h6 className="fw-semibold text-center mb-3">{subjectInfo.subject}</h6>
                          <div style={{ width: "100%", height: 220 }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                  data={subjectInfo.pieData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius="45%"
                                  outerRadius="70%"
                                  paddingAngle={4}
                                  label={false}
                                  onClick={(data) => handleChartInteraction(subjectInfo.subject, data.name)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {subjectInfo.pieData.map((entry) => (
                                    <Cell
                                      key={entry.name}
                                      fill={
                                        entry.name === "Pass" ? "#28a745" :
                                        entry.name === "Fail" ? "#ffc107" : "#dc3545"
                                      }
                                      opacity={
                                        activeAnalysis[subjectInfo.subject] && activeAnalysis[subjectInfo.subject] !== entry.name
                                          ? 0.3
                                          : 1
                                      }
                                    />
                                  ))}
                                </Pie>
                                <Legend 
                                  wrapperStyle={{ cursor: 'pointer' }} 
                                  onClick={(d) => handleChartInteraction(subjectInfo.subject, d.value)} 
                                  verticalAlign="bottom" 
                                  height={30} 
                                />
                                <Tooltip content={<CustomTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="text-center mt-2 mb-2">
                            <p className="text-muted small mb-1">Highest: <span className="fw-semibold">{subjectInfo.highest}</span></p>
                            <p className="small mb-0">
                              Pass: <span className="text-success fw-bold">{subjectInfo.passCount}</span> · 
                              Fail: <span className="text-danger fw-bold">{subjectInfo.failCount}</span> · 
                              Absent: <span className="text-muted fw-bold">{subjectInfo.absentCount}</span>
                            </p>
                          </div>

                          {activeAnalysis[subjectInfo.subject] && (
                            <div className="mt-3 border-top pt-3 animate__animated animate__fadeIn">
                              <h6 className={`small fw-bold mb-2 ${
                                activeAnalysis[subjectInfo.subject] === 'Pass' ? 'text-success' :
                                activeAnalysis[subjectInfo.subject] === 'Fail' ? 'text-warning' : 'text-danger'
                              }`}>
                                {activeAnalysis[subjectInfo.subject]} List:
                              </h6>
                              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.75rem' }}>
                                  <tbody>
                                    {filteredStudents.filter(s => {
                                      const marks = s[subjectInfo.subject];
                                      const category = activeAnalysis[subjectInfo.subject];
                                      if (category === 'Pass') return typeof marks === 'number' && marks >= getPassThresholdForSubject(subjectInfo.subject);
                                      if (category === 'Fail') return typeof marks === 'number' && marks < getPassThresholdForSubject(subjectInfo.subject);
                                      if (category === 'Absent') return typeof marks !== 'number';
                                      return false;
                                    }).map(s => (
                                      <tr key={s.roll}>
                                        <td className="fw-bold">{s.roll}</td>
                                        <td className="text-truncate" style={{ maxWidth: '100px' }}>{s.name}</td>
                                        <td className="text-end">{s[subjectInfo.subject]}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Removed "Students by Failed Subjects" card per user request */}
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <h5 className="card-title mb-1">Arrear Details (Failed Subjects Count)</h5>
                  <p className="text-muted small mb-0">Distribution of students by arrear count.</p>
                </div>
              </div>

              <div style={{ height: "420px" }}>
                <ResponsiveContainer>
                  <BarChart data={manualArrearData.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      label={{ value: "Arrear count", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, dataMax => Math.max(dataMax + 4, dataMax * 1.1)]}
                      label={{ value: "Students", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Students" fill="#ff6b6b" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="value" position="top" style={{ fill: "#212529", fontWeight: 600 }} offset={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Top 3 Students</h5>
              <div className="list-group" style={{ cursor: "pointer" }}>
                {top3Students.map((student, idx) => (
                  <div key={student.roll} className="list-group-item list-group-item-action" onClick={() => toggleStudent(student.roll)}>
                    <div className="d-flex w-100 justify-content-between align-items-center">
                      <h6 className="mb-1">#{idx + 1} {student.name} ({student.roll})</h6>
                      <span className="badge bg-primary rounded-pill">{student.totalMarks} marks</span>
                    </div>
                    {expandedStudentRoll === student.roll && (
                      <div className="mt-3 p-2 bg-light rounded text-sm">
                        <div className="row">
                          {stats.subjects.map(sub => (
                            <div key={sub} className="col-6 mb-1">
                              <span className="text-muted fw-bold">{sub}:</span> {student[sub] || 0}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Failed Students (Arrears)</h5>
              <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto', cursor: "pointer" }}>
                {manualArrearData.failedStudentsList.length === 0 ? (
                  <div className="alert alert-success">No students have arrears!</div>
                ) : (
                  manualArrearData.failedStudentsList.map((student) => (
                    <div key={student.roll} className="list-group-item list-group-item-action list-group-item-warning" onClick={() => toggleStudent(student.roll)}>
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        <h6 className="mb-1">{student.name} ({student.roll})</h6>
                        <span className="badge bg-danger rounded-pill">{student.arrearCount} Arrear{student.arrearCount > 1 ? 's' : ''}</span>
                      </div>
                      {expandedStudentRoll === student.roll && (
                        <div className="mt-3 p-2 bg-white rounded text-sm text-danger border border-danger">
                          <p className="mb-1 fw-bold">Failed Subjects:</p>
                          <ul className="mb-0 ps-3">
                            {student.failedSubjects.map(sub => (
                              <li key={sub}>{sub} (Marks: {student[sub] || 0})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}