import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Body parser with 20MB limit for image uploads
app.use(express.json({ limit: '20mb' }));

// Initialize GoogleGenAI SDK on server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: Parse Timetable from Photo
app.post('/api/parse-timetable', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!ai) {
      // Fallback: If no API key is provided, return intelligent sample MBBS timetable
      return res.json({
        success: true,
        isSimulated: true,
        slots: [
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            subjectName: 'Clinical Postings / Hospital Wards',
            subjectCode: 'CLIN201',
            room: 'Civil Hospital Wards',
            teacher: 'Unit Chiefs',
            type: 'lab',
          },
          {
            dayOfWeek: 1,
            startTime: '13:00',
            endTime: '14:00',
            subjectName: 'Pathology',
            subjectCode: 'PATH201',
            room: 'Pathology LT',
            teacher: 'Dr. R. K. Gupta',
            type: 'theory',
          },
          {
            dayOfWeek: 1,
            startTime: '14:00',
            endTime: '15:00',
            subjectName: 'Pharmacology',
            subjectCode: 'PHARM201',
            room: 'Pharmacology LT',
            teacher: 'Dr. Meenakshi',
            type: 'theory',
          },
          {
            dayOfWeek: 2,
            startTime: '09:00',
            endTime: '12:00',
            subjectName: 'Clinical Postings / Hospital Wards',
            subjectCode: 'CLIN201',
            room: 'Civil Hospital Wards',
            teacher: 'Unit Chiefs',
            type: 'lab',
          },
          {
            dayOfWeek: 2,
            startTime: '13:00',
            endTime: '14:00',
            subjectName: 'Microbiology',
            subjectCode: 'MICRO201',
            room: 'Microbiology LT',
            teacher: 'Dr. Sandeep Mukherjee',
            type: 'theory',
          },
          {
            dayOfWeek: 2,
            startTime: '14:00',
            endTime: '15:00',
            subjectName: 'Forensic Medicine & Toxicology (FMT)',
            subjectCode: 'FMT201',
            room: 'FMT Dept',
            teacher: 'Dr. Vivek Saxena',
            type: 'theory',
          },
          {
            dayOfWeek: 3,
            startTime: '13:00',
            endTime: '14:00',
            subjectName: 'Community Medicine (PSM)',
            subjectCode: 'PSM201',
            room: 'PSM Lecture Hall',
            teacher: 'Dr. Preeti Deshpande',
            type: 'theory',
          },
          {
            dayOfWeek: 3,
            startTime: '14:00',
            endTime: '16:00',
            subjectName: 'Pathology & Microbiology Practicals',
            subjectCode: 'LAB201',
            room: 'Histopathology Lab',
            teacher: 'Dr. Gupta & Dr. Mukherjee',
            type: 'lab',
          },
        ],
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this image of a college/university class timetable or schedule.
Extract each scheduled class slot and its timing.
For dayOfWeek, use: 1 for Monday, 2 for Tuesday, 3 for Wednesday, 4 for Thursday, 5 for Friday, 6 for Saturday, 0 for Sunday.
For start and end time, use 24-hour format (e.g. "09:00", "14:00").
Provide clean subject names, standard subject codes if visible (or generate short 4-5 letter code like CS301, MATH2), room numbers, and instructor names if readable.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of timetable class slots extracted from the image',
          items: {
            type: Type.OBJECT,
            properties: {
              dayOfWeek: {
                type: Type.INTEGER,
                description: 'Day of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun',
              },
              startTime: {
                type: Type.STRING,
                description: 'Start time in HH:MM format',
              },
              endTime: {
                type: Type.STRING,
                description: 'End time in HH:MM format',
              },
              subjectName: {
                type: Type.STRING,
                description: 'Full name of the course or subject',
              },
              subjectCode: {
                type: Type.STRING,
                description: 'Course or subject code (e.g. CS301)',
              },
              room: {
                type: Type.STRING,
                description: 'Classroom or Lab name/number',
              },
              teacher: {
                type: Type.STRING,
                description: 'Instructor or faculty name if visible',
              },
              type: {
                type: Type.STRING,
                description: 'Session type: theory, lab, or tutorial',
              },
            },
            required: ['dayOfWeek', 'startTime', 'endTime', 'subjectName'],
          },
        },
      },
    });

    const parsedSlots = JSON.parse(response.text?.trim() || '[]');
    return res.json({
      success: true,
      slots: parsedSlots,
    });
  } catch (error: any) {
    console.error('Error parsing timetable image with Gemini:', error);
    return res.status(500).json({
      error: 'Failed to extract timetable from photo',
      details: error.message || String(error),
    });
  }
});

// Serve Digital Asset Links for Android TWA verification
app.get('/.well-known/assetlinks.json', (_req, res) => {
  const assetlinksPath = path.resolve(process.cwd(), 'public', '.well-known', 'assetlinks.json');
  if (fs.existsSync(assetlinksPath)) {
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(assetlinksPath);
  }
  const distAssetlinks = path.resolve(process.cwd(), 'dist', '.well-known', 'assetlinks.json');
  if (fs.existsSync(distAssetlinks)) {
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(distAssetlinks);
  }
  res.status(404).send('Not found');
});

// Serve Manifest JSON
app.get('/manifest.json', (_req, res) => {
  const manifestPath = path.resolve(process.cwd(), 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    return res.sendFile(manifestPath);
  }
  const distManifest = path.resolve(process.cwd(), 'dist', 'manifest.json');
  if (fs.existsSync(distManifest)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    return res.sendFile(distManifest);
  }
  res.status(404).send('Not found');
});

// Vite Middleware integration for dev mode & production static serve
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
