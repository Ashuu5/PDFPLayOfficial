import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Mic, MicOff, Download, Loader2, FileText, Languages,
  FileType, Check, X, Upload
} from 'lucide-react';

/* ============ LANGUAGES ============ */
const INPUT_LANGUAGES = [
  { code: 'ur-PK', name: 'Urdu' },
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'de-DE', name: 'German' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'fr-FR', name: 'French' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'fa-IR', name: 'Persian' },
  { code: 'bn-BD', name: 'Bengali' },
];

const OUTPUT_LANGUAGES = [
  'Urdu', 'English', 'Hindi', 'Punjabi', 'Spanish', 'Russian',
  'German', 'Arabic', 'French', 'Chinese', 'Japanese', 'Korean',
  'Italian', 'Portuguese', 'Dutch', 'Greek', 'Hebrew', 'Thai',
  'Vietnamese', 'Turkish', 'Persian', 'Bengali',
];

/* ============ APPLICATION TEMPLATES ============ */
const APPLICATION_TEMPLATES = [
  {
    id: 'sick-leave',
    name: 'Sick Leave',
    format: `To,
The Principal,
[School/Office Name]

Subject: Application for Sick Leave

Respected Sir/Madam,

I am writing to inform you that I am suffering from [illness] and cannot attend [school/office] for [number] days. I request you to grant me sick leave from [date] to [date].

I will be highly obliged.

Thanking you,
Yours obediently,
[Your Name]
[Class/Designation]
[Date]`
  },
  {
    id: 'urgent-work',
    name: 'Urgent Work',
    format: `To,
The Principal,
[School/Office Name]

Subject: Application for Urgent Piece of Work

Respected Sir/Madam,

I am writing to inform you that I have an urgent piece of work at [home/other] and cannot attend [school/office] today. I request you to grant me leave for one day.

I will be highly obliged.

Thanking you,
Yours obediently,
[Your Name]
[Class/Designation]
[Date]`
  },
  {
    id: 'marriage-leave',
    name: 'Marriage Leave',
    format: `To,
The Principal,
[School/Office Name]

Subject: Application for Marriage Leave

Respected Sir/Madam,

I am writing to inform you that the marriage of my [brother/sister/relative] is going to be held on [date]. I need to attend the ceremony. I request you to grant me leave from [date] to [date].

I will be highly obliged.

Thanking you,
Yours obediently,
[Your Name]
[Class/Designation]
[Date]`
  },
  {
    id: 'job-application',
    name: 'Job Application',
    format: `To,
The Manager,
[Company Name]

Subject: Application for the Post of [Position]

Respected Sir/Madam,

I am writing to apply for the post of [Position] in your esteemed organization. I have completed [Education] from [Institution] and have [experience] years of experience in [field].

I am confident that my skills and qualifications make me a suitable candidate for this position. I have attached my resume for your kind consideration.

I would be grateful if you consider my application.

Thanking you,
Yours sincerely,
[Your Name]
[Contact Number]
[Date]`
  },
  {
    id: 'complaint',
    name: 'Complaint',
    format: `To,
The Authority,
[Department/Organization]

Subject: Complaint Regarding [Issue]

Respected Sir/Madam,

I am writing to bring to your kind attention that [describe the issue]. This has been causing [problem] to [affected people/area].

I request you to take necessary action to resolve this issue at the earliest.

Thanking you,
Yours faithfully,
[Your Name]
[Address]
[Date]`
  },
  {
    id: 'character-certificate',
    name: 'Character Certificate',
    format: `To,
The Principal,
[School/College Name]

Subject: Application for Character Certificate

Respected Sir/Madam,

I am writing to request a character certificate. I need it for [purpose]. I have been a student of this institution from [year] to [year] and have maintained good conduct throughout.

I request you to issue my character certificate at the earliest.

Thanking you,
Yours obediently,
[Your Name]
[Class/Roll Number]
[Date]`
  },
  {
    id: 'fee-concession',
    name: 'Fee Concession',
    format: `To,
The Principal,
[School/College Name]

Subject: Application for Fee Concession

Respected Sir/Madam,

I am writing to request a fee concession. Due to [financial hardship/reason], my family is unable to pay the full fee. I am a hardworking student and have always performed well in my studies.

I request you to kindly grant me a fee concession.

Thanking you,
Yours obediently,
[Your Name]
[Class/Roll Number]
[Date]`
  },
  {
    id: 'transfer',
    name: 'Transfer',
    format: `To,
The Authority,
[Department/Organization]

Subject: Application for Transfer

Respected Sir/Madam,

I am writing to request a transfer from [current location] to [desired location] due to [reason]. I have been serving at [current location] for [duration] and have fulfilled all my responsibilities.

I request you to kindly consider my transfer request.

Thanking you,
Yours faithfully,
[Your Name]
[Designation]
[Date]`
  },
  {
    id: 'leave-extension',
    name: 'Leave Extension',
    format: `To,
The Principal,
[School/Office Name]

Subject: Application for Leave Extension

Respected Sir/Madam,

I am writing to request an extension of my leave. I was granted leave from [date] to [date] but due to [reason], I am unable to return on the scheduled date. I request you to extend my leave till [date].

I will be highly obliged.

Thanking you,
Yours obediently,
[Your Name]
[Class/Designation]
[Date]`
  },
  {
    id: 'emergency-leave',
    name: 'Emergency Leave',
    format: `To,
The Principal,
[School/Office Name]

Subject: Application for Emergency Leave

Respected Sir/Madam,

I am writing to inform you that due to an emergency at [home/other], I need to leave immediately. I request you to grant me emergency leave for [duration].

I will be highly obliged.

Thanking you,
Yours obediently,
[Your Name]
[Class/Designation]
[Date]`
  },
];

export default function AudioToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [selectedInputLang, setSelectedInputLang] = useState('ur-PK');
  const [selectedOutputLang, setSelectedOutputLang] = useState('Urdu');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  /* ============ LIVE AUDIO ============ */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Browser does not support live audio. Use Chrome/Edge/Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedInputLang;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final) {
        transcriptRef.current += final;
        setTranscript(transcriptRef.current);
      }
      setInterimText(interim);
    };

    recognition.onerror = (e: any) => {
      setError(`Error: ${e.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setError('');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  };

  /* ============ AUDIO FILE UPLOAD ============ */
  const handleAudioFile = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const { pipeline } = await import('@huggingface/transformers');
      const transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny'
      );

      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      const output = await transcriber(audioData as any);
      setTranscript(output.text || '');
      setSuccess('Audio file transcribed successfully!');
    } catch (err: any) {
      console.error(err);
      setError('Audio file processing failed. ' + (err.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  /* ============ APPLY TEMPLATE ============ */
  const applyTemplate = () => {
    if (!selectedTemplate) return;
    const t = APPLICATION_TEMPLATES.find((x) => x.id === selectedTemplate);
    if (t) setTranscript(t.format);
  };

  /* ============ PDF DOWNLOAD ============ */
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;

    doc.setFont('helvetica');
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(transcript, usableWidth);
    let y = margin;

    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7;
    });

    doc.save(`application-${Date.now()}.pdf`);
    setSuccess('PDF downloaded!');
  };

  /* ============ WORD DOWNLOAD ============ */
  const downloadWord = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: transcript.split('\n').map(
            (line) =>
              new Paragraph({
                children: [new TextRun({ text: line || ' ', size: 24 })],
                spacing: { after: 120 },
                alignment: AlignmentType.LEFT,
              })
          ),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application-${Date.now()}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Word document downloaded!');
  };

  return (
    <ToolPage
      title="Audio to Text & Application Writer"
      description="Record or upload audio, convert to text, and generate application formats."
      icon={<Mic className="w-8 h-8 text-rose-500" />}
      color="rose"
    >
      <div className="space-y-6">
        {/* NOTE */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200">
          <strong className="text-amber-300">Note:</strong> For best results, use a quiet
          environment. Background noise can reduce accuracy.
        </div>

        {/* LIVE AUDIO */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Live Audio Recording</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedInputLang}
              onChange={(e) => setSelectedInputLang(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-rose-400/50"
            >
              {INPUT_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#1f2333]">
                  {l.name}
                </option>
              ))}
            </select>

            {!isListening ? (
              <button
                onClick={startListening}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold rounded-lg"
              >
                <Mic className="w-4 h-4" /> Start Recording
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg"
              >
                <MicOff className="w-4 h-4" /> Stop Recording
              </button>
            )}

            {isListening && (
              <span className="text-xs text-red-400 animate-pulse">● Recording...</span>
            )}
          </div>

          {interimText && (
            <div className="mt-3 p-2 rounded bg-white/5 text-xs text-gray-400 italic">
              {interimText}
            </div>
          )}
        </div>

        {/* AUDIO FILE UPLOAD */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Upload Audio File (Whisper)</h3>
          </div>

          <FileUpload
            onFilesAccepted={handleAudioFile}
            accept={{ 'audio/*': ['.mp3', '.wav', '.m4a', '.webm', '.ogg'] }}
            multiple={false}
            title="Drop audio file here"
            subtitle="MP3, WAV, M4A, WebM supported"
            icon={<FileText className="w-6 h-6 text-rose-400" />}
          />

          {processing && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-300">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing audio... (first time
              loads ~74MB model)
            </div>
          )}
        </div>

        {/* TEMPLATES */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Application Templates</h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {APPLICATION_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTemplate === t.id
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            onClick={applyTemplate}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold rounded-lg disabled:opacity-30"
          >
            Apply Template
          </button>
        </div>

        {/* OUTPUT */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Output Text</h3>
            <select
              value={selectedOutputLang}
              onChange={(e) => setSelectedOutputLang(e.target.value)}
              className="ml-auto px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
            >
              {OUTPUT_LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-[#1f2333]">
                  {l}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              transcriptRef.current = e.target.value;
            }}
            rows={12}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-400/50 font-mono leading-relaxed resize-none"
            placeholder="Your text will appear here..."
          />

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={downloadPDF}
              disabled={!transcript}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold rounded-lg disabled:opacity-30"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={downloadWord}
              disabled={!transcript}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg disabled:opacity-30"
            >
              <FileType className="w-4 h-4" /> Word
            </button>
          </div>
        </div>

        {/* ERROR / SUCCESS */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-sm text-red-300 flex items-start gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30 text-sm text-green-300 flex items-start gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{success}</span>
          </div>
        )}
      </div>
    </ToolPage>
  );
}