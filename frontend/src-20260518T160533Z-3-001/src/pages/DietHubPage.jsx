import React, { useState } from 'react';

const CONDITIONS = ['PCOS','Fibroid','Anemia','Ovarian','Endometriosis'];

const PLANS = {
  PCOS: {
    color:'var(--cyan)', icon:'🧬',
    eat:    ['Leafy greens (spinach, kale)','Berries & cherries','Whole grains (oats, quinoa)','Legumes (lentils, chickpeas)','Fatty fish (salmon, mackerel)','Nuts & seeds (flaxseed, walnuts)','Lean protein (chicken, tofu)'],
    avoid:  ['Refined sugar & sweets','White bread & white rice','Processed & packaged foods','Sugary drinks & juices','Trans fats & fried foods','Excess dairy','Alcohol'],
    moderate:['Red meat (1–2×/week)','Whole fruit (2–3 servings/day)','Dairy (prefer low-fat)'],
    supplements:[{s:'Inositol (Myo + D-Chiro)',d:'4g + 400mg daily',n:'Improves insulin sensitivity'},{s:'Vitamin D3',d:'2000 IU/day',n:'Often deficient in PCOS'},{s:'Magnesium',d:'300mg/day',n:'Reduces insulin resistance'},{s:'Omega-3',d:'2g EPA+DHA/day',n:'Anti-inflammatory'}],
    meals:[{m:'Breakfast',f:'Oats with flaxseed, berries, and almond milk'},{m:'Mid-Morning',f:'Handful of walnuts + 1 apple'},{m:'Lunch',f:'Quinoa salad with chickpeas, spinach, olive oil'},{m:'Afternoon',f:'Greek yoghurt with chia seeds'},{m:'Dinner',f:'Grilled salmon with steamed broccoli and brown rice'},{m:'Evening',f:'Chamomile tea + 2 walnuts'}],
  },
  Fibroid: {
    color:'var(--violet)', icon:'⬡',
    eat:    ['Fruits high in vitamin C (citrus, kiwi)','Green vegetables (kale, broccoli)','Iron-rich foods (spinach, lentils)','Anti-inflammatory foods (turmeric, ginger)','High-fibre foods (beans, oats)','Calcium sources (fortified plant milk)','Flaxseeds (phytoestrogens)'],
    avoid:  ['Red meat (pro-inflammatory)','Alcohol (raises oestrogen)','High-sugar foods','Refined carbohydrates','Non-organic produce (pesticides mimic oestrogen)','Trans fats','Excess caffeine'],
    moderate:['Dairy products','Poultry','Soy products'],
    supplements:[{s:'Vitamin D3',d:'2000–4000 IU/day',n:'Shown to inhibit fibroid growth'},{s:'Iron',d:'As per CBC result',n:'For anaemia from heavy bleeding'},{s:'Green tea extract',d:'400mg EGCG/day',n:'May reduce fibroid size'},{s:'Vitamin C',d:'500mg/day',n:'Improves iron absorption'}],
    meals:[{m:'Breakfast',f:'Smoothie: spinach, banana, flaxseed, fortified oat milk'},{m:'Mid-Morning',f:'Orange slices + almonds'},{m:'Lunch',f:'Lentil soup with turmeric and crusty rye bread'},{m:'Afternoon',f:'Kiwi fruit + green tea'},{m:'Dinner',f:'Baked chicken (small portion) with roasted veg and quinoa'},{m:'Evening',f:'Ginger tea'}],
  },
  Anemia: {
    color:'var(--rose)', icon:'🩸',
    eat:    ['Red meat (beef, lamb — 2×/week)','Organ meats (liver — 1×/week)','Shellfish (clams, oysters)','Leafy greens (spinach, Swiss chard)','Legumes (lentils, kidney beans)','Vitamin C with every iron-rich meal','Fortified cereals'],
    avoid:  ['Tea & coffee with meals (block iron)','Calcium supplements with iron','Phytate-rich foods without vitamin C pairing','Alcohol','Excessive fibre supplements at meal time'],
    moderate:['Dairy','Whole grains','Raw spinach (oxalates reduce iron)'],
    supplements:[{s:'Iron (ferrous sulfate)',d:'As prescribed by doctor',n:'Take with vitamin C; separate from calcium'},{s:'Vitamin C',d:'500mg with each meal',n:'Increases non-haem iron absorption 3×'},{s:'Vitamin B12',d:'1000mcg/day',n:'If B12-deficiency anaemia'},{s:'Folate',d:'400–800mcg/day',n:'For megaloblastic anaemia'}],
    meals:[{m:'Breakfast',f:'Fortified oat porridge with orange juice'},{m:'Mid-Morning',f:'Boiled egg + kiwi'},{m:'Lunch',f:'Lentil dahl with lemon squeeze and rice'},{m:'Afternoon',f:'Iron-fortified biscuits + vitamin C drink'},{m:'Dinner',f:'Beef stir-fry with spinach, bell peppers and brown rice'},{m:'Evening',f:'Warm water with lemon'}],
  },
  Ovarian: {
    color:'var(--emerald)', icon:'🔬',
    eat:    ['Anti-inflammatory foods (fatty fish, olive oil)','Antioxidant-rich vegetables','Magnesium-rich foods (dark chocolate, avocado)','High-fibre foods','Lean protein','Low-GI carbohydrates','Plenty of water (2L+/day)'],
    avoid:  ['High-fat processed foods','Red & processed meat','Refined carbohydrates','Excess sugar','Alcohol','Excess caffeine'],
    moderate:['Dairy','Eggs','Poultry'],
    supplements:[{s:'Magnesium',d:'300–400mg/day',n:'Reduces pelvic cramping'},{s:'Vitamin D3',d:'2000 IU/day',n:'Supports ovarian health'},{s:'Omega-3',d:'2g/day',n:'Reduces cyst inflammation'},{s:'N-Acetyl Cysteine',d:'600mg/day',n:'Antioxidant; may reduce cyst recurrence'}],
    meals:[{m:'Breakfast',f:'Avocado toast on rye with poached egg'},{m:'Mid-Morning',f:'Dark chocolate (2 squares) + almonds'},{m:'Lunch',f:'Grilled salmon salad with olive oil and lemon'},{m:'Afternoon',f:'Cucumber slices + hummus'},{m:'Dinner',f:'Turkey meatballs with zucchini noodles and tomato sauce'},{m:'Evening',f:'Peppermint tea'}],
  },
  Endometriosis: {
    color:'var(--amber)', icon:'◈',
    eat:    ['Omega-3 rich fish (salmon, sardines)','Dark leafy greens','Colourful vegetables (red, yellow, orange)','Ginger & turmeric','High-fibre foods','Organic produce where possible','Green tea'],
    avoid:  ['Red meat (promotes inflammation & oestrogen)','Alcohol (oestrogen metabolism)','Caffeine','Trans fats','Gluten (some women report symptom reduction)','Dairy (casein may worsen inflammation)','Excess sugar'],
    moderate:['Whole grains','Eggs','Poultry'],
    supplements:[{s:'Omega-3 (EPA+DHA)',d:'3g/day',n:'Strongest evidence for pain reduction'},{s:'Vitamin D3',d:'4000 IU/day',n:'Linked to endometriosis severity'},{s:'Curcumin',d:'500mg 2×/day with black pepper',n:'Inhibits endometrial cell proliferation'},{s:'Magnesium',d:'400mg/day',n:'Reduces dysmenorrhoea'}],
    meals:[{m:'Breakfast',f:'Smoothie: mixed berries, ginger, flaxseed, coconut milk'},{m:'Mid-Morning',f:'Walnuts + green tea'},{m:'Lunch',f:'Sardine salad with rocket, avocado and lemon'},{m:'Afternoon',f:'Turmeric latte (oat milk)'},{m:'Dinner',f:'Baked salmon with roasted sweet potato and kale'},{m:'Evening',f:'Chamomile & ginger tea'}],
  },
};

export default function DietHubPage() {
  const [active, setActive] = useState('PCOS');
  const plan = PLANS[active];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-breadcrumb">NeuralCore · Health Tools</div>
          <h1 className="page-title">🥗 Diet & Nutrition Hub</h1>
          <p className="page-subtitle">Evidence-based nutrition plans tailored to each condition.</p>
        </div>
        <div className="page-badges"><span className="badge badge-amber">5 Conditions</span><span className="badge badge-teal">Evidence-Based</span></div>
      </div>

      {/* Condition tabs */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'2rem' }}>
        {CONDITIONS.map(c => (
          <button key={c} onClick={() => setActive(c)}
            style={{ padding:'0.5rem 1.2rem', borderRadius:10, border:'1.5px solid', borderColor: active===c ? PLANS[c].color : 'var(--border)', background: active===c ? `color-mix(in srgb, ${PLANS[c].color} 12%, transparent)` : 'var(--surface)', color: active===c ? PLANS[c].color : 'var(--text-2)', fontSize:'0.85rem', fontWeight: active===c ? 700 : 500, cursor:'pointer', transition:'all 0.18s' }}>
            {PLANS[c].icon} {c}
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
        {/* Foods to eat */}
        <div className="card">
          <div className="card-title" style={{ color:'var(--emerald)' }}>✅ Foods to Eat</div>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {plan.eat.map((f,i) => <li key={i} style={{ fontSize:'0.85rem', color:'var(--text-1)', display:'flex', gap:'0.5rem', alignItems:'flex-start' }}><span style={{ color:'var(--emerald)', flexShrink:0 }}>→</span>{f}</li>)}
          </ul>
        </div>
        {/* Foods to avoid */}
        <div className="card">
          <div className="card-title" style={{ color:'var(--rose)' }}>❌ Foods to Avoid</div>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {plan.avoid.map((f,i) => <li key={i} style={{ fontSize:'0.85rem', color:'var(--text-1)', display:'flex', gap:'0.5rem', alignItems:'flex-start' }}><span style={{ color:'var(--rose)', flexShrink:0 }}>✕</span>{f}</li>)}
          </ul>
        </div>
      </div>

      {/* Sample meal plan */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-title">🍽️ Sample Daily Meal Plan</div>
        <table className="data-table">
          <thead><tr><th>Meal</th><th>Suggestion</th></tr></thead>
          <tbody>{plan.meals.map((r,i) => <tr key={i}><td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', color:'var(--text-3)' }}>{r.m}</td><td>{r.f}</td></tr>)}</tbody>
        </table>
      </div>

      {/* Supplements */}
      <div className="card">
        <div className="card-title">💊 Recommended Supplements</div>
        <table className="data-table">
          <thead><tr><th>Supplement</th><th>Dosage</th><th>Notes</th></tr></thead>
          <tbody>{plan.supplements.map((r,i) => <tr key={i}><td style={{ fontWeight:600 }}>{r.s}</td><td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', color:'var(--cyan)' }}>{r.d}</td><td style={{ fontSize:'0.82rem', color:'var(--text-2)' }}>{r.n}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="disclaimer" style={{ marginTop:'1.5rem' }}>⚠ Always consult a registered dietitian or physician before making significant dietary changes or starting supplements.</div>
    </div>
  );
}
