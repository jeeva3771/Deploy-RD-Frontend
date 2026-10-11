export const DOT_CLASS = {
  grey: 's-grey',
  amber: 's-amber',
  green: 's-green',
  blue: 's-blue',
  teal: 's-teal',
  yellow: 's-yellow',
  red: 's-red'
};

export const STATUS_CLASS = {
  grey: 'sp-grey',
  amber: 'sp-amber',
  green: 'sp-green',
  blue: 'sp-blue',
  teal: 'sp-teal',
  yellow: 'sp-yellow',
  red: 'sp-red'
};

export const STATUS_LABELS = {
  grey: 'Idle / Queue',
  amber: 'Inward Pending',
  green: 'Ready to Process',
  blue: 'Processing',
  teal: 'Completed',
  red: 'Hold / Block'
};

export const gNow = () => {
  const d = new Date();
  let hr = d.getHours();
  const min = d.getMinutes().toString().padStart(2, '0');
  const ampm = hr >= 12 ? 'pm' : 'am';
  hr = hr % 12;
  hr = hr ? hr : 12;
  return `${hr}:${min} ${ampm}`;
};

export const gDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

export const SEED_FLOORS = [
  { id: 'sf1', name: 'Laser Cutting Studio', type: 'mach', accent: '#0D9488', pattern: 'A', primaryVar: 'Time (mins)', spec: 'A (Bystronic), B (Trumpf)', supervisor: 'Vikram', icon: '✂️', sealed: true },
  { id: 'sf2', name: 'UV Printing Studio', type: 'mach', accent: '#7C3AED', pattern: 'A', primaryVar: 'Sq. Inch', spec: 'Mimaki, Handtop Flatbed', supervisor: 'Aniket', icon: '🖨️', sealed: true },
  { id: 'sf3', name: 'DTP Pre-Press', type: 'man', accent: '#3B82F6', pattern: 'B', primaryVar: 'UPS / Sheet', spec: 'Artwork, Nesting, Plate', supervisor: 'Rakesh', icon: '🖥️', sealed: false },
  { id: 'sf10', name: 'Shimmer Printing', type: 'mach', accent: '#EAB308', pattern: 'A', primaryVar: 'UPS / Sheet', spec: 'Shimmer Screen 1', supervisor: 'Mohan', icon: '✨', sealed: false },
  { id: 'sf5', name: 'Sublimation Studio', type: 'mach', accent: '#EC4899', pattern: 'A', primaryVar: 'UPS / Sheet', spec: 'Epson F-540, Monti Antonio', supervisor: 'Priya', icon: '🌀', sealed: false },
  { id: 'sf6', name: 'Etching Dept', type: 'man', accent: '#EF4444', pattern: 'B', primaryVar: 'Pcs count', spec: 'Mask, Etch Bath, Neutralize', supervisor: 'Nagaraj', icon: '🛸', sealed: false },
  { id: 'sf7', name: 'Plating Dept', type: 'man', accent: '#10B981', pattern: 'B', primaryVar: 'Pcs count', spec: 'Anodize, Gold/Nickel, Seal', supervisor: 'Jagdish', icon: '🔑', sealed: false },
  { id: 'sf8', name: 'Painting Dept', type: 'man', accent: '#F97316', pattern: 'B', primaryVar: 'Pcs count', spec: 'Prime, Base, Top Clear, Bake', supervisor: 'Sanjay', icon: '🎨', sealed: false },
  { id: 'sf9', name: 'Machining Dept', type: 'mach', accent: '#64748B', pattern: 'A', primaryVar: 'Time (mins)', spec: 'Haas CNC VMC, Lathe', supervisor: 'Karan', icon: '🔧', sealed: false },
  { id: 'sf4', name: 'Assembly Bay', type: 'man', accent: '#0D9488', pattern: 'B', primaryVar: 'Pcs count', spec: 'Glues, Top fit, Engraving', supervisor: 'Ganesh', icon: '🔓', sealed: true },
  { id: 'sf11', name: 'QC Department', type: 'qc', accent: '#0F766E', pattern: 'C', primaryVar: 'Pcs count', icon: '🔍', sealed: false },
  { id: 'sf12', name: 'Finished Goods Store', type: 'auto', accent: '#2563EB', pattern: 'C', primaryVar: 'Pcs count', icon: '📦', sealed: false },
  { id: 'sf13', name: 'Packing Dept', type: 'man', accent: '#10B981', pattern: 'B', primaryVar: 'Pcs count', spec: 'Shrink, Box, Outer Label', supervisor: 'Sunita', icon: '📦', sealed: false },
  { id: 'sf14', name: 'Dispatch / Logistics', type: 'man', accent: '#2563EB', pattern: 'B', primaryVar: 'Pcs count', spec: 'Consignment, Docket, Load', supervisor: 'Sunita', icon: '🚚', sealed: false },
  { id: 'sf15', name: 'Stores', type: 'inv', accent: '#64748B', pattern: 'C', primaryVar: 'Ledgers', icon: '🏪', sealed: false },
  { id: 'sf16', name: 'Accounts / Billing', type: 'owner', accent: '#F59E0B', pattern: 'C', primaryVar: 'Invoices', icon: '💳', sealed: false }
];
