import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Hammer, Send, Database, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const defaultOpenings = [{ type: "дверь", width: 0.9, height: 2.1, count: 1 }, { type: "окно", width: 1.5, height: 1.4, count: 1 }];

function App() {
  const [form, setForm] = useState({ room_shape: "прямоугольная", zone_type: "сухая зона", length: 5, width: 4, height: 2.8, floor_covering: "ламинат", wall_covering: "краска", ceiling_covering: "краска", openingsText: JSON.stringify(defaultOpenings, null, 2), user_question: "Рассчитай основные площади помещения и подскажи, какие материалы нужно уточнить для ремонта." });
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);

  const requestPayload = useMemo(() => {
    let openings = [];
    try { openings = JSON.parse(form.openingsText || "[]"); } catch { openings = []; }
    return { room_shape: form.room_shape, zone_type: form.zone_type, length: Number(form.length), width: Number(form.width), height: Number(form.height), floor_covering: form.floor_covering, wall_covering: form.wall_covering, ceiling_covering: form.ceiling_covering, openings, user_question: form.user_question };
  }, [form]);

  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function submitConsultation() {
    setLoading(true); setError(null); setAnswer(null);
    try { JSON.parse(form.openingsText || "[]"); } catch { setLoading(false); setError("Поле проёмов должно быть корректным JSON-массивом."); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/consult`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestPayload) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
      setAnswer(data);
    } catch (err) { setError(err.message || "Ошибка запроса к backend."); } finally { setLoading(false); }
  }

  return <main className="appShell">
    <header className="hero"><div><div className="eyebrow"><Hammer size={16}/> Stage 7 · Fullstack web integration</div><h1>AI-консультант по ремонту помещения</h1><p>Полноценное web-приложение на базе RAG: пользователь вводит параметры помещения, backend выполняет валидацию, FAISS-поиск по базе знаний и возвращает структурированный ответ.</p></div><div className="heroCard"><Database/><strong>RAG pipeline</strong><span>chunks → embeddings → FAISS → context → answer</span></div></header>
    <section className="layout">
      <form className="panel" onSubmit={(e)=>e.preventDefault()}><h2>Параметры помещения</h2><div className="grid2">
        <Select label="Форма помещения" value={form.room_shape} onChange={(v)=>updateField("room_shape", v)} options={["прямоугольная","круглая","Г-образная","сложная"]}/>
        <Select label="Тип зоны" value={form.zone_type} onChange={(v)=>updateField("zone_type", v)} options={["сухая зона","влажная зона","кухонная зона"]}/>
        <Input label="Длина, м" value={form.length} onChange={(v)=>updateField("length", v)}/>
        <Input label="Ширина, м" value={form.width} onChange={(v)=>updateField("width", v)}/>
        <Input label="Высота, м" value={form.height} onChange={(v)=>updateField("height", v)}/>
        <Select label="Пол" value={form.floor_covering} onChange={(v)=>updateField("floor_covering", v)} options={["ламинат","плитка","керамогранит","наливной пол","линолеум"]}/>
        <Select label="Стены" value={form.wall_covering} onChange={(v)=>updateField("wall_covering", v)} options={["краска","обои","плитка","декоративная штукатурка"]}/>
        <Select label="Потолок" value={form.ceiling_covering} onChange={(v)=>updateField("ceiling_covering", v)} options={["краска","натяжной потолок","побелка"]}/>
      </div><Label title="Проёмы JSON"><textarea value={form.openingsText} onChange={(e)=>updateField("openingsText", e.target.value)} rows={7}/></Label><Label title="Вопрос консультанту"><textarea value={form.user_question} onChange={(e)=>updateField("user_question", e.target.value)} rows={4}/></Label><button className="primaryButton" type="button" onClick={submitConsultation} disabled={loading}><Send size={18}/>{loading ? "Формирую ответ..." : "Сформировать ответ"}</button>{error && <div className="alert error"><AlertTriangle size={18}/><span>{error}</span></div>}</form>
      <section className="panel resultPanel"><h2>Результат консультанта</h2>{!answer && !loading && <div className="emptyState"><FileText size={38}/><p>После запуска здесь появятся расчётные показатели, ответ консультанта и найденные RAG-фрагменты.</p></div>}{loading && <div className="loader">Идёт запрос к backend и базе знаний...</div>}{answer && <Results answer={answer}/>}</section>
    </section>
  </main>;
}

function Select({label, value, onChange, options}) { return <label>{label}<select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map((x)=><option key={x}>{x}</option>)}</select></label>; }
function Input({label, value, onChange}) { return <label>{label}<input type="number" step="0.1" min="0" value={value} onChange={(e)=>onChange(e.target.value)}/></label>; }
function Label({title, children}) { return <label>{title}{children}</label>; }
function Metric({label, value}) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Results({answer}) { return <div className="results"><div className="successLine"><CheckCircle2 size={18}/><span>Ответ сформирован</span></div><div className="metricGrid"><Metric label="Площадь пола" value={`${answer.metrics.floor_area} м²`}/><Metric label="Площадь потолка" value={`${answer.metrics.ceiling_area} м²`}/><Metric label="Периметр" value={`${answer.metrics.perimeter} м`}/><Metric label="Стены чистая" value={`${answer.metrics.wall_area_net} м²`}/><Metric label="Проёмы" value={`${answer.metrics.openings_area} м²`}/><Metric label="Плинтус" value={`${answer.metrics.skirting_length} м.пог.`}/></div><article className="answerBox"><h3>Ответ</h3><pre>{answer.answer}</pre></article><details className="chunksBox"><summary>Найденные RAG-фрагменты</summary>{answer.search_results.map((item)=><div className="chunkItem" key={`${item.rank}-${item.chunk_id}`}><strong>#{item.rank} · chunk_id={item.chunk_id} · score={item.score.toFixed(4)}</strong><p>{item.text.slice(0,700)}{item.text.length > 700 ? "..." : ""}</p></div>)}</details></div>; }

createRoot(document.getElementById("root")).render(<App/>);
