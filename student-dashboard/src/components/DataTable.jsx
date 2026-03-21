import React, { useState } from "react";

const getPassThresholdForSubject = (subject = "") => {
  const s = subject.toLowerCase();
  return (s.includes("assembly") || s.includes("evs")) ? 15 : 30;
};

export default function DataTable({ data = [] }) {
  const [selectedSubject, setSelectedSubject] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="alert alert-info">No data available.</div>
    );
  }

  const subjectKeys = Object.keys(data[0] || {}).filter(
    key => key !== 'roll' && key !== 'name'
  );

  const passedAll = data.filter(student =>
    subjectKeys.every(subject => {
      const marks = student[subject];
      return typeof marks === 'number' && marks >= getPassThresholdForSubject(subject);
    })
  );

  const failedAll = data.filter(student =>
    subjectKeys.every(subject => {
      const marks = student[subject];
      return typeof marks === 'number' && marks < getPassThresholdForSubject(subject);
    })
  );

  const absentees = data.filter(student =>
    subjectKeys.some(subject => typeof student[subject] !== 'number')
  );

  const renderMiniTable = (title, students, bgColor, type = "default") => (
    <div className={`card mb-4 border-${bgColor} shadow-sm h-100`}>
      <div className={`card-header bg-${bgColor} text-white d-flex justify-content-between align-items-center`}>
        <h6 className="mb-0 fw-bold text-uppercase small">{title}</h6>
        <span className="badge bg-white text-dark rounded-pill">{students.length}</span>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive" style={{ maxHeight: '250px' }}>
          <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light sticky-top">
              <tr>
                <th className="ps-3">Roll No</th>
                <th>Name</th>
                {type === "absent" ? <th>Absent Subjects</th> : <th>Total</th>}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-3 text-muted">No students found</td></tr>
              ) : (
                students.map((st, idx) => {
                  const total = subjectKeys.reduce((sum, key) => sum + (typeof st[key] === 'number' ? st[key] : 0), 0);
                  const absentSubs = subjectKeys.filter(s => typeof st[s] !== 'number').join(", ");
                  return (
                    <tr key={idx}>
                      <td className="ps-3 fw-bold">{st.roll}</td>
                      <td className="text-truncate" style={{ maxWidth: '120px' }} title={st.name}>{st.name}</td>
                      <td className="fw-bold text-end pe-3">
                        {type === "absent" ? <span className="text-danger small">{absentSubs}</span> : total}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSubjectAnalysis = () => {
    if (!selectedSubject) return null;

    const threshold = getPassThresholdForSubject(selectedSubject);
    const subjectAbsentees = data.filter(s => typeof s[selectedSubject] !== 'number');
    const subjectFailures = data.filter(s => typeof s[selectedSubject] === 'number' && s[selectedSubject] < threshold);

    return (
      <div className="card shadow-sm border-primary mb-4 animate__animated animate__fadeIn">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Analysis: {selectedSubject}</h5>
          <button className="btn btn-sm btn-light" onClick={() => setSelectedSubject(null)}>Close</button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 border-end">
              <h6 className="text-warning fw-bold mb-3">Absentees in This Subject ({subjectAbsentees.length})</h6>
              <ul className="list-group list-group-flush small" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {subjectAbsentees.length > 0 ? subjectAbsentees.map(s => (
                  <li key={s.roll} className="list-group-item d-flex justify-content-between">
                    <span>{s.name} ({s.roll})</span>
                    <span className="badge bg-warning text-dark">{s[selectedSubject]}</span>
                  </li>
                )) : <li className="list-group-item text-muted">No absentees</li>}
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="text-danger fw-bold mb-3">Failures in This Subject ({subjectFailures.length})</h6>
              <ul className="list-group list-group-flush small" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {subjectFailures.length > 0 ? subjectFailures.map(s => (
                  <li key={s.roll} className="list-group-item d-flex justify-content-between">
                    <span>{s.name} ({s.roll})</span>
                    <span className="badge bg-danger">{s[selectedSubject]} marks</span>
                  </li>
                )) : <li className="list-group-item text-muted">No failures</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3">
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          {renderMiniTable("Passed All Subjects", passedAll, "success")}
        </div>
        <div className="col-12 col-md-4">
          {renderMiniTable("Failed All Subjects", failedAll, "danger")}
        </div>
        <div className="col-12 col-md-4">
          {renderMiniTable("Absentees (Any Subject)", absentees, "warning", "absent")}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-muted fw-bold mb-3 small text-uppercase">Analyze Specific Subject:</h6>
        <div className="d-flex flex-wrap gap-2">
          {subjectKeys.map(sub => (
            <button
              key={sub}
              className={`btn btn-sm ${selectedSubject === sub ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedSubject(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {renderSubjectAnalysis()}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-dark text-white p-3">
          <h5 className="mb-0">Full Dataset View</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  {subjectKeys.map((subject) => (
                    <th key={subject}>{subject}</th>
                  ))}
                  <th>Total</th>
                  <th>Average</th>
                </tr>
              </thead>
              <tbody>
                {data.map((student, index) => {
                  const total = subjectKeys.reduce((sum, key) => sum + (typeof student[key] === 'number' ? student[key] : 0), 0);
                  const average = (total / 270) * 100;

                  return (
                    <tr key={index}>
                      <td className="fw-bold">{student.roll || '-'}</td>
                      <td>{student.name || '-'}</td>
                      {subjectKeys.map((subject) => (
                        <td key={subject} className={(typeof student[subject] !== "number" || student[subject] < getPassThresholdForSubject(subject)) ? 'text-danger fw-bold' : ''}>
                          {student[subject] !== undefined ? student[subject] : 0}
                        </td>
                      ))}
                      <td className="fw-bold bg-light">{Math.round(total * 100) / 100}</td>
                      <td className="fw-bold bg-light">{Math.round(average * 100) / 100}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-secondary">
                <tr>
                  <td colSpan="2" className="fw-bold">Average</td>
                  {subjectKeys.map((subject) => {
                    const validData = data.filter(s => typeof s[subject] === 'number');
                    const avg = validData.length > 0 ? validData.reduce((sum, s) => sum + s[subject], 0) / validData.length : 0;
                    return (
                      <td key={subject} className="fw-bold">
                        {Math.round(avg * 100) / 100}
                      </td>
                    );
                  })}
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
