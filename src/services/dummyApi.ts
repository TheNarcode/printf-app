import type {FileWithSettings, Order, OrderTimeline} from '../types';

function mockFile(name: string, size: number, pages: number, color: 'color' | 'bw' = 'color', copies: number = 1, price: number = 0): FileWithSettings {
  return {
    file: {id: `f-${Math.random().toString(36).slice(2)}`, name, uri: `file:///mock/${name}`, size, type: name.match(/\.(jpg|jpeg|png)$/i) ? 'image/jpeg' : 'application/pdf', pages},
    settings: {colorMode: color, paperSize: 'a4', sides: 'single', copies, pageRange: 'all', pagesPerSheet: 1},
    price,
  };
}

const PRINTERS = [
  {number: '07', name: 'HP DesignJet Z9+'},
  {number: '03', name: 'Canon imagePROGRAF'},
  {number: '11', name: 'Epson SureColor'},
  {number: '05', name: 'HP PageWide XL'},
  {number: '09', name: 'Xerox VersaLink'},
  {number: '14', name: 'Brother MFC-L8900'},
];

export function getMockOrders(): Order[] {
  const now = new Date();
  return [
    {
      id: 'ord-1',
      orderRef: '#PRN-2024-0847',
      createdAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      files: [
        mockFile('Q3_Financial_Report.pdf', 662016, 12, 'color', 250, 54),
      ],
      totalPrice: 58.32,
      convenienceFee: 4.32,
      status: 'printing',
      printerNumber: '07',
      printerName: 'HP DesignJet Z9+',
      totalPages: 12,
      totalCopies: 250,
      progress: 45,
      estimatedCompletion: new Date(now.getTime() + 75 * 60000).toISOString(),
    },
    {
      id: 'ord-2',
      orderRef: '#PRN-2024-0823',
      createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      files: [
        mockFile('Marketing_Brochures_v2.pdf', 1048576, 8, 'color', 100, 48),
      ],
      totalPrice: 51.84,
      convenienceFee: 3.84,
      status: 'pending',
      printerNumber: '03',
      printerName: 'Canon imagePROGRAF',
      totalPages: 8,
      totalCopies: 100,
      progress: 0,
    },
    {
      id: 'ord-3',
      orderRef: '#PRN-2024-0811',
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      files: [
        mockFile('Client_Presentation_Posters.pdf', 2048000, 6, 'color', 10, 36),
      ],
      totalPrice: 38.88,
      convenienceFee: 2.88,
      status: 'completed',
      printerNumber: '11',
      printerName: 'Epson SureColor',
      totalPages: 6,
      totalCopies: 10,
      progress: 100,
    },
    {
      id: 'ord-4',
      orderRef: '#PRN-2024-0798',
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      files: [
        mockFile('Architectural_Blueprints.pdf', 4096000, 24, 'bw', 5, 60),
      ],
      totalPrice: 64.80,
      convenienceFee: 4.80,
      status: 'failed',
      printerNumber: '05',
      printerName: 'HP PageWide XL',
      totalPages: 24,
      totalCopies: 5,
      progress: 62,
    },
    {
      id: 'ord-5',
      orderRef: '#PRN-2024-0776',
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      files: [
        mockFile('Employee_Handbook_2024.pdf', 512000, 42, 'bw', 25, 84),
        mockFile('Cover_Page.pdf', 51200, 1, 'color', 25, 6),
      ],
      totalPrice: 97.20,
      convenienceFee: 7.20,
      status: 'completed',
      printerNumber: '09',
      printerName: 'Xerox VersaLink',
      totalPages: 43,
      totalCopies: 25,
      progress: 100,
    },
  ];
}

export function getOrderTimeline(order: Order): OrderTimeline[] {
  const base = new Date(order.createdAt);
  const fmt = (d: Date) => d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true});

  const items: OrderTimeline[] = [
    {label: 'Order placed', time: fmt(base), completed: true},
    {label: 'Payment received', time: fmt(new Date(base.getTime() + 5000)), completed: true},
  ];

  if (order.status === 'failed') {
    items.push({label: 'Print failed', time: fmt(new Date(base.getTime() + 60000)), completed: true});
    return items;
  }

  const isStarted = ['printing', 'completed'].includes(order.status);
  const isDone = order.status === 'completed';

  items.push({
    label: `Sent to Printer ${order.printerNumber}`,
    time: isStarted ? fmt(new Date(base.getTime() + 30000)) : '--',
    completed: isStarted,
  });
  items.push({
    label: 'Print completed',
    time: isDone ? fmt(new Date(base.getTime() + 180000)) : '--',
    completed: isDone,
  });

  return items;
}

export async function processPayment(amount: number): Promise<{success: boolean; transactionId: string}> {
  await new Promise<void>(r => setTimeout(r, 2000));
  return {success: true, transactionId: `txn_${Date.now()}`};
}
