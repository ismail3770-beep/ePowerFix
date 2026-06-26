export interface CalculatorInput {
  key: string
  label: string
  labelBn: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
}
export interface CalculatorOutput {
  key: string
  label: string
  labelBn: string
  value: string
  unit: string
}
export interface Calculator {
  id: string
  name: string
  nameBn: string
  description: string
  descriptionBn: string
  icon: string
  inputs: CalculatorInput[]
  calculate: (inputs: Record<string, number>) => CalculatorOutput[]
}

// 1. Cable Size Calculator
export const cableSizeCalculator: Calculator = {
  id: 'cable-size',
  name: 'Cable Size',
  nameBn: 'কেবল সাইজ',
  description: 'Calculate required cable size based on load and distance',
  descriptionBn: 'লোড ও দূরত্বের ভিত্তিতে প্রয়োজনীয় কেবল সাইজ বের করুন',
  icon: 'Cable',
  inputs: [
    { key: 'load', label: 'Total Load', labelBn: 'মোট লোড', unit: 'kW', min: 0.5, max: 100, step: 0.5, defaultValue: 5 },
    { key: 'voltage', label: 'Voltage', labelBn: 'ভোল্টেজ', unit: 'V', min: 110, max: 440, step: 10, defaultValue: 220 },
    { key: 'distance', label: 'Distance', labelBn: 'দূরত্ব', unit: 'meters', min: 1, max: 200, step: 1, defaultValue: 30 },
    { key: 'pf', label: 'Power Factor', labelBn: 'পাওয়ার ফ্যাক্টর', unit: '', min: 0.5, max: 1, step: 0.05, defaultValue: 0.85 },
  ],
  calculate: (inputs) => {
    const current = (inputs.load * 1000) / (inputs.voltage * inputs.pf * 1.732)
    const voltageDrop = (2 * current * inputs.distance * 0.0175) / inputs.voltage
    const voltageDropPercent = (voltageDrop * 100).toFixed(2)
    let cableSize = '1.5 mm²'
    if (current > 35) cableSize = '10 mm²'
    else if (current > 25) cableSize = '6 mm²'
    else if (current > 15) cableSize = '4 mm²'
    else if (current > 10) cableSize = '2.5 mm²'
    return [
      { key: 'current', label: 'Current', labelBn: 'কারেন্ট', value: current.toFixed(2), unit: 'A' },
      { key: 'voltageDrop', label: 'Voltage Drop', labelBn: 'ভোল্টেজ ড্রপ', value: voltageDropPercent, unit: '%' },
      { key: 'cableSize', label: 'Recommended Cable', labelBn: 'প্রস্তাবিত কেবল', value: cableSize, unit: '' },
    ]
  },
}

// 2. Voltage Drop Calculator
export const voltageDropCalculator: Calculator = {
  id: 'voltage-drop',
  name: 'Voltage Drop',
  nameBn: 'ভোল্টেজ ড্রপ',
  description: 'Calculate voltage drop over cable run',
  descriptionBn: 'কেবলের ভোল্টেজ ড্রপ বের করুন',
  icon: 'Zap',
  inputs: [
    { key: 'current', label: 'Current', labelBn: 'কারেন্ট', unit: 'A', min: 1, max: 200, step: 1, defaultValue: 15 },
    { key: 'distance', label: 'Distance', labelBn: 'দূরত্ব', unit: 'meters', min: 1, max: 500, step: 1, defaultValue: 50 },
    { key: 'cableSize', label: 'Cable Size', labelBn: 'কেবল সাইজ', unit: 'mm²', min: 1, max: 50, step: 0.5, defaultValue: 2.5 },
    { key: 'voltage', label: 'Source Voltage', labelBn: 'সোর্স ভোল্টেজ', unit: 'V', min: 110, max: 440, step: 10, defaultValue: 220 },
  ],
  calculate: (inputs) => {
    const resistance = (0.0175 * inputs.distance) / inputs.cableSize
    const vDrop = 2 * inputs.current * resistance
    const vDropPercent = ((vDrop / inputs.voltage) * 100).toFixed(2)
    const isAcceptable = parseFloat(vDropPercent) <= 3
    return [
      { key: 'voltageDrop', label: 'Voltage Drop', labelBn: 'ভোল্টেজ ড্রপ', value: vDrop.toFixed(2), unit: 'V' },
      { key: 'percentage', label: 'Drop Percentage', labelBn: 'ড্রপ শতাংশ', value: vDropPercent, unit: '%' },
      { key: 'status', label: 'Status', labelBn: 'স্ট্যাটাস', value: isAcceptable ? 'Acceptable (≤3%)' : 'Use larger cable', unit: '' },
    ]
  },
}

// 3. LED Savings Calculator
export const ledSavingsCalculator: Calculator = {
  id: 'led-savings',
  name: 'LED Savings',
  nameBn: 'LED সেভিংস',
  description: 'Compare LED vs conventional lighting costs',
  descriptionBn: 'LED ও প্রচলিত বাল্বের খরচ তুলনা করুন',
  icon: 'Lightbulb',
  inputs: [
    { key: 'conventionalWatt', label: 'Conventional Bulb', labelBn: 'সাধারণ বাল্ব', unit: 'Watt', min: 10, max: 200, step: 5, defaultValue: 60 },
    { key: 'ledWatt', label: 'LED Bulb', labelBn: 'LED বাল্ব', unit: 'Watt', min: 1, max: 50, step: 1, defaultValue: 9 },
    { key: 'hoursPerDay', label: 'Usage Hours/Day', labelBn: 'দৈনিক ব্যবহার', unit: 'hours', min: 1, max: 24, step: 1, defaultValue: 8 },
    { key: 'bulbCount', label: 'Number of Bulbs', labelBn: 'বাল্ব সংখ্যা', unit: '', min: 1, max: 100, step: 1, defaultValue: 10 },
    { key: 'ratePerUnit', label: 'Electricity Rate', labelBn: 'বিদ্যুৎের হার', unit: '৳/kWh', min: 1, max: 20, step: 0.5, defaultValue: 8.5 },
  ],
  calculate: (inputs) => {
    const dailyConv = (inputs.conventionalWatt * inputs.hoursPerDay * inputs.bulbCount) / 1000
    const dailyLed = (inputs.ledWatt * inputs.hoursPerDay * inputs.bulbCount) / 1000
    const monthlyConv = dailyConv * 30 * inputs.ratePerUnit
    const monthlyLed = dailyLed * 30 * inputs.ratePerUnit
    const saving = monthlyConv - monthlyLed
    const yearlySaving = saving * 12
    return [
      { key: 'monthlyConv', label: 'Conventional Monthly', labelBn: 'সাধারণ বাল্ব মাসিক', value: '৳ ' + monthlyConv.toFixed(0), unit: '' },
      { key: 'monthlyLed', label: 'LED Monthly', labelBn: 'LED মাসিক', value: '৳ ' + monthlyLed.toFixed(0), unit: '' },
      { key: 'monthlySaving', label: 'Monthly Saving', labelBn: 'মাসিক সঞ্চয়', value: '৳ ' + saving.toFixed(0), unit: '' },
      { key: 'yearlySaving', label: 'Yearly Saving', labelBn: 'বার্ষিক সঞ্চয়', value: '৳ ' + yearlySaving.toFixed(0), unit: '' },
    ]
  },
}

// 4. Solar Panel Size Calculator
export const solarPanelCalculator: Calculator = {
  id: 'solar-panel',
  name: 'Solar Panel Size',
  nameBn: 'সোলার প্যানেল সাইজ',
  description: 'Calculate required solar panel capacity',
  descriptionBn: 'প্রয়োজনীয় সোলার প্যানেল সাইজ বের করুন',
  icon: 'Sun',
  inputs: [
    { key: 'dailyLoad', label: 'Daily Consumption', labelBn: 'দৈনিক ব্যবহার', unit: 'kWh', min: 1, max: 100, step: 1, defaultValue: 10 },
    { key: 'sunHours', label: 'Peak Sun Hours', labelBn: 'সানশাইন আওয়ার', unit: 'hours', min: 2, max: 8, step: 0.5, defaultValue: 4.5 },
    { key: 'efficiency', label: 'System Efficiency', labelBn: 'সিস্টেম এফিসিয়েন্সি', unit: '%', min: 60, max: 95, step: 5, defaultValue: 80 },
  ],
  calculate: (inputs) => {
    const panelKW = inputs.dailyLoad / (inputs.sunHours * (inputs.efficiency / 100))
    const panelWatt = Math.ceil(panelKW * 1000)
    const panels = Math.ceil(panelWatt / 550) // 550W panels
    return [
      { key: 'requiredKW', label: 'Required Capacity', labelBn: 'প্রয়োজনীয় ক্ষমতা', value: panelKW.toFixed(2), unit: 'kW' },
      { key: 'panels', label: 'Panels Needed (550W)', labelBn: 'প্রয়োজনীয় প্যানেল (৫৫০W)', value: String(panels), unit: '' },
      { key: 'totalWatt', label: 'Total Wattage', labelBn: 'মোট ওয়াট', value: String(panelWatt), unit: 'W' },
    ]
  },
}

// 5. Load Calculator (kW ↔ HP)
export const loadCalculator: Calculator = {
  id: 'load',
  name: 'Load Calculator',
  nameBn: 'লোড ক্যালকুলেটর',
  description: 'Convert between kW, HP, Amps',
  descriptionBn: 'kW, HP, Amps মধ্যে রূপান্তর করুন',
  icon: 'Gauge',
  inputs: [
    { key: 'value', label: 'Value', labelBn: 'মান', unit: '', min: 0.1, max: 1000, step: 0.1, defaultValue: 5 },
    { key: 'fromUnit', label: 'From Unit', labelBn: 'থেকে ইউনিট', unit: '', min: 1, max: 3, step: 1, defaultValue: 1 },
    { key: 'voltage', label: 'Voltage', labelBn: 'ভোল্টেজ', unit: 'V', min: 110, max: 440, step: 10, defaultValue: 220 },
    { key: 'pf', label: 'Power Factor', labelBn: 'পাওয়ার ফ্যাক্টর', unit: '', min: 0.5, max: 1, step: 0.05, defaultValue: 0.85 },
  ],
  calculate: (inputs) => {
    const units = ['kW', 'HP', 'Ampere']
    const fromUnit = units[Math.round(inputs.fromUnit) - 1]
    let kw = inputs.value
    if (fromUnit === 'HP') kw = inputs.value * 0.746
    if (fromUnit === 'Ampere') kw = (inputs.value * inputs.voltage * inputs.pf) / 1000
    const hp = kw / 0.746
    const amps = (kw * 1000) / (inputs.voltage * inputs.pf)
    return [
      { key: 'kw', label: 'Kilowatt', labelBn: 'কিলোওয়াট', value: kw.toFixed(2), unit: 'kW' },
      { key: 'hp', label: 'Horsepower', labelBn: 'হর্সপাওয়ার', value: hp.toFixed(2), unit: 'HP' },
      { key: 'amp', label: 'Amperes', labelBn: 'অ্যাম্পিয়ার', value: amps.toFixed(2), unit: 'A' },
    ]
  },
}

// 6. Breaker Size Calculator
export const breakerSizeCalculator: Calculator = {
  id: 'breaker-size',
  name: 'Breaker Size',
  nameBn: 'ব্রেকার সাইজ',
  description: 'Calculate MCB/MCCB size for your load',
  descriptionBn: 'আপনার লোডের জন্য MCB/MCCB সাইজ বের করুন',
  icon: 'Shield',
  inputs: [
    { key: 'load', label: 'Total Load', labelBn: 'মোট লোড', unit: 'kW', min: 0.5, max: 200, step: 0.5, defaultValue: 7.5 },
    { key: 'voltage', label: 'Voltage', labelBn: 'ভোল্টেজ', unit: 'V', min: 110, max: 440, step: 10, defaultValue: 220 },
    { key: 'pf', label: 'Power Factor', labelBn: 'পাওয়ার ফ্যাক্টর', unit: '', min: 0.5, max: 1, step: 0.05, defaultValue: 0.85 },
    { key: 'phase', label: 'Phase', labelBn: 'ফেজ', unit: '', min: 1, max: 3, step: 2, defaultValue: 1 },
  ],
  calculate: (inputs) => {
    const current = (inputs.load * 1000) / (inputs.voltage * inputs.pf * (inputs.phase === 3 ? 1.732 : 1))
    const breakerAmp = Math.ceil(current * 1.25)
    let breakerType = 'MCB'
    if (breakerAmp > 63) breakerType = 'MCCB'
    const standardSizes = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250]
    const selectedSize = standardSizes.find((s) => s >= breakerAmp) || 250
    return [
      { key: 'current', label: 'Full Load Current', labelBn: 'ফুল লোড কারেন্ট', value: current.toFixed(2), unit: 'A' },
      { key: 'breaker', label: 'Breaker Size', labelBn: 'ব্রেকার সাইজ', value: String(selectedSize), unit: 'A' },
      { key: 'type', label: 'Type', labelBn: 'টাইপ', value: breakerType, unit: '' },
    ]
  },
}

// 7. Battery Backup Calculator
export const batteryBackupCalculator: Calculator = {
  id: 'battery-backup',
  name: 'Battery Backup',
  nameBn: 'ব্যাটারি ব্যাকআপ',
  description: 'Calculate battery backup time',
  descriptionBn: 'ব্যাটারি ব্যাকআপ সময় বের করুন',
  icon: 'Battery',
  inputs: [
    { key: 'batteryAh', label: 'Battery Capacity', labelBn: 'ব্যাটারি ক্যাপাসিটি', unit: 'Ah', min: 10, max: 300, step: 10, defaultValue: 100 },
    { key: 'batteryVoltage', label: 'Battery Voltage', labelBn: 'ব্যাটারি ভোল্টেজ', unit: 'V', min: 6, max: 48, step: 2, defaultValue: 12 },
    { key: 'loadWatt', label: 'Load', labelBn: 'লোড', unit: 'Watt', min: 10, max: 5000, step: 10, defaultValue: 200 },
    { key: 'inverterEfficiency', label: 'Inverter Efficiency', labelBn: 'ইনভার্টার এফিসিয়েন্সি', unit: '%', min: 70, max: 95, step: 5, defaultValue: 85 },
    { key: 'dod', label: 'Depth of Discharge', labelBn: 'ডিসচার্জ গভীরতা', unit: '%', min: 50, max: 100, step: 5, defaultValue: 80 },
  ],
  calculate: (inputs) => {
    const totalWH = inputs.batteryAh * inputs.batteryVoltage * (inputs.dod / 100)
    const usableWH = totalWH * (inputs.inverterEfficiency / 100)
    const backupHours = usableWH / inputs.loadWatt
    return [
      { key: 'totalWH', label: 'Total Energy', labelBn: 'মোট এনার্জি', value: totalWH.toFixed(0), unit: 'Wh' },
      { key: 'usableWH', label: 'Usable Energy', labelBn: 'ব্যবহারযোগ্য এনার্জি', value: usableWH.toFixed(0), unit: 'Wh' },
      { key: 'backup', label: 'Backup Time', labelBn: 'ব্যাকআপ সময়', value: backupHours.toFixed(1), unit: 'hours' },
    ]
  },
}

// 8. Electricity Bill Calculator
export const electricityBillCalculator: Calculator = {
  id: 'electricity-bill',
  name: 'Electricity Bill',
  nameBn: 'বিদ্যুৎ বিল',
  description: 'Calculate monthly electricity bill (BDT)',
  descriptionBn: 'মাসিক বিদ্যুৎ বিল বের করুন',
  icon: 'Receipt',
  inputs: [
    { key: 'units', label: 'Monthly Units', labelBn: 'মাসিক ইউনিট', unit: 'kWh', min: 1, max: 5000, step: 10, defaultValue: 200 },
    { key: 'demandCharge', label: 'Demand Charge', labelBn: 'ডিমান্ড চার্জ', unit: '৳', min: 0, max: 500, step: 10, defaultValue: 45 },
    { key: 'vat', label: 'VAT', labelBn: 'ভ্যাট', unit: '%', min: 0, max: 15, step: 0.5, defaultValue: 5 },
  ],
  calculate: (inputs) => {
    let energyCharge = 0
    const u = inputs.units
    if (u <= 75) energyCharge = u * 4.19
    else if (u <= 200) energyCharge = 75 * 4.19 + (u - 75) * 5.72
    else if (u <= 300) energyCharge = 75 * 4.19 + 125 * 5.72 + (u - 200) * 6.0
    else if (u <= 400) energyCharge = 75 * 4.19 + 125 * 5.72 + 100 * 6.0 + (u - 300) * 6.34
    else energyCharge = 75 * 4.19 + 125 * 5.72 + 100 * 6.0 + 100 * 6.34 + (u - 400) * 9.98
    const subtotal = energyCharge + inputs.demandCharge
    const vatAmount = subtotal * (inputs.vat / 100)
    const total = subtotal + vatAmount
    return [
      { key: 'energy', label: 'Energy Charge', labelBn: 'এনার্জি চার্জ', value: '৳ ' + energyCharge.toFixed(0), unit: '' },
      { key: 'demand', label: 'Demand Charge', labelBn: 'ডিমান্ড চার্জ', value: '৳ ' + inputs.demandCharge, unit: '' },
      { key: 'vat', label: 'VAT', labelBn: 'ভ্যাট', value: '৳ ' + vatAmount.toFixed(0), unit: '' },
      { key: 'total', label: 'Total Bill', labelBn: 'মোট বিল', value: '৳ ' + total.toFixed(0), unit: '' },
    ]
  },
}

export const allCalculators: Calculator[] = [
  cableSizeCalculator,
  voltageDropCalculator,
  ledSavingsCalculator,
  solarPanelCalculator,
  loadCalculator,
  breakerSizeCalculator,
  batteryBackupCalculator,
  electricityBillCalculator,
]
