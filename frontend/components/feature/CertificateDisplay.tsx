'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { CertificateWithDetails } from '@/lib/types/certificate';
import { ToastService } from '@/lib/toast/ToastService';
import { useI18n } from '@/lib/i18n';

interface CertificateDisplayProps {
  certificate: CertificateWithDetails;
  showActions?: boolean;
}

export function CertificateDisplay({ certificate, showActions = true }: CertificateDisplayProps) {
  const { t } = useI18n();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    try {
      // Wait for all fonts (Cormorant Garamond, EB Garamond) to fully load
      await document.fonts.ready;
      // Wait for animations to complete (cert-animate is 0.7s + 0.3s delay = 1s total)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const el = certificateRef.current;
      const SCALE = 4; // 4× pixel density — very sharp

      const canvas = await html2canvas(el, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fdf8f0',
        logging: false,
        imageTimeout: 0,
        onclone: (_doc, cloned) => {
          // ① Kill all fade-in animations — prevents semi-transparent capture
          cloned.querySelectorAll<HTMLElement>('.cert-animate, .cert-animate-2, .cert-animate-3').forEach(n => {
            n.style.animation = 'none';
            n.style.opacity = '1';
            n.style.transform = 'none';
          });

          // ② Darken light text colors for PDF contrast
          const colorMap: Record<string, string> = {
            '#7a5c2e': '#3d2a0f',
            '#9a7840': '#5a3d10',
            '#8a6914': '#4a2e05',
            '#5c3d0a': '#2c1a00',
            'rgba(122, 92, 46': 'rgba(61, 42, 15',
            'rgba(154, 120, 64': 'rgba(90, 61, 16',
          };
          cloned.querySelectorAll<HTMLElement>('*').forEach(el => {
            const s = el.getAttribute('style');
            if (!s) return;
            let ns = s;
            Object.entries(colorMap).forEach(([light, dark]) => {
              ns = ns.split(light).join(dark);
            });
            if (ns !== s) el.setAttribute('style', ns);
          });

          // ③ Hide elements html2canvas can't render correctly
          cloned.querySelectorAll<HTMLElement>('[data-pdf-hide]').forEach(n => { n.style.display = 'none'; });

          // ④ Fix backdrop-filter (unsupported by html2canvas)
          cloned.querySelectorAll<HTMLElement>('[data-pdf-stat]').forEach(n => {
            n.style.backdropFilter = 'none';
            (n.style as any).webkitBackdropFilter = 'none';
            n.style.background = '#ffffff';
            n.style.border = '1px solid rgba(184,134,11,0.35)';
          });

          // ⑤ Remove watermark gradient (renders incorrectly)
          const wm = cloned.querySelector<HTMLElement>('.cert-watermark');
          if (wm) wm.style.backgroundImage = 'none';
        },
      });

      const imgData = canvas.toDataURL('image/png');
      // PDF page = exact element dimensions; image = 4× resolution → razor sharp
      const pdfW = el.offsetWidth;
      const pdfH = el.offsetHeight;
      // Derive orientation from actual content — avoids jsPDF swapping dimensions
      const orientation = pdfW >= pdfH ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`certificate_${certificate.certificate_number}.pdf`);
      ToastService.success('Certificate downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download certificate:', error);
      ToastService.error('Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  const levelLabel =
    ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as Record<string, string>)[
      certificate.course_level
    ] ?? certificate.course_level;

  return (
    <Container className="max-w-4xl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

        /* Lora: full Vietnamese support, elegant serif for the recipient name */
        .cert-name  { font-family: 'Lora', Georgia, serif; }
        /* Be Vietnam Pro: designed for Vietnamese, clean & professional for headings/body */
        .cert-title { font-family: 'Be Vietnam Pro', sans-serif; }
        .cert-body  { font-family: 'Be Vietnam Pro', sans-serif; }

        @keyframes cert-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cert-animate { animation: cert-fade-in 0.7s ease both; }
        .cert-animate-2 { animation: cert-fade-in 0.7s 0.15s ease both; }
        .cert-animate-3 { animation: cert-fade-in 0.7s 0.3s ease both; }

        /* Guilloché-style radial watermark */
        .cert-watermark {
          background-image:
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              rgba(180,140,60,0.045) 0deg 2deg,
              transparent 2deg 8deg
            ),
            repeating-radial-gradient(
              circle at 50% 50%,
              transparent 0px,
              transparent 18px,
              rgba(180,140,60,0.03) 19px,
              transparent 20px
            );
        }

        /* Corner ornaments — elegant framed bracket with diamond tip */
        .cert-corner {
          width: 60px; height: 60px;
          position: absolute;
          pointer-events: none;
        }
        .cert-corner::before,
        .cert-corner::after {
          content: '';
          position: absolute;
          background: linear-gradient(to right, #c9a84c, #b8860b);
        }

        /* Top-left ┌ */
        .cert-corner-tl { top: 16px; left: 16px; }
        .cert-corner-tl::before { top: 0; left: 0; width: 100%; height: 1.5px; }
        .cert-corner-tl::after  { top: 0; left: 0; width: 1.5px; height: 100%; }

        /* Top-right ┐ */
        .cert-corner-tr { top: 16px; right: 16px; }
        .cert-corner-tr::before { top: 0; right: 0; left: auto; width: 100%; height: 1.5px; background: linear-gradient(to left, #c9a84c, #b8860b); }
        .cert-corner-tr::after  { top: 0; right: 0; left: auto; width: 1.5px; height: 100%; background: linear-gradient(to bottom, #c9a84c, #b8860b); }

        /* Bottom-left └ */
        .cert-corner-bl { bottom: 16px; left: 16px; }
        .cert-corner-bl::before { bottom: 0; top: auto; left: 0; width: 100%; height: 1.5px; background: linear-gradient(to right, #c9a84c, #b8860b); }
        .cert-corner-bl::after  { bottom: 0; top: auto; left: 0; width: 1.5px; height: 100%; background: linear-gradient(to top, #c9a84c, #b8860b); }

        /* Bottom-right ┘ */
        .cert-corner-br { bottom: 16px; right: 16px; }
        .cert-corner-br::before { bottom: 0; top: auto; right: 0; left: auto; width: 100%; height: 1.5px; background: linear-gradient(to left, #c9a84c, #b8860b); }
        .cert-corner-br::after  { bottom: 0; top: auto; right: 0; left: auto; width: 1.5px; height: 100%; background: linear-gradient(to top, #c9a84c, #b8860b); }

        /* Diamond dot at the corner tip */
        .cert-corner-inner {
          position: absolute;
          width: 7px; height: 7px;
          background: #c9a84c;
          transform: rotate(45deg);
        }
        .cert-corner-tl .cert-corner-inner { top: -3px; left: -3px; }
        .cert-corner-tr .cert-corner-inner { top: -3px; right: -3px; }
        .cert-corner-bl .cert-corner-inner { bottom: -3px; left: -3px; }
        .cert-corner-br .cert-corner-inner { bottom: -3px; right: -3px; }
      `}</style>

      {/* ─── Certificate ─── */}
      <div
        ref={certificateRef}
        className="relative overflow-hidden cert-watermark"
        style={{
          background: 'linear-gradient(160deg, #fdf8f0 0%, #faf3e4 40%, #fdf6eb 100%)',
          border: '2px solid #c9a84c',
          boxShadow: '0 0 0 6px #fdf8f0, 0 0 0 8px rgba(184,134,11,0.25), 0 20px 60px rgba(0,0,0,0.12)',
          borderRadius: '4px',
        }}
      >
        {/* Outer decorative border line */}
        <div
          className="absolute inset-[10px] pointer-events-none"
          style={{ border: '1px solid rgba(184,134,11,0.3)', borderRadius: '2px' }}
        />

        {/* Corner ornaments */}
        <div className="cert-corner cert-corner-tl"><div className="cert-corner-inner" /></div>
        <div className="cert-corner cert-corner-tr"><div className="cert-corner-inner" /></div>
        <div className="cert-corner cert-corner-bl"><div className="cert-corner-inner" /></div>
        <div className="cert-corner cert-corner-br"><div className="cert-corner-inner" /></div>

        {/* Central guilloché medallion watermark — hidden in PDF export */}
        <div
          data-pdf-hide
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '320px', height: '320px',
            borderRadius: '50%',
            border: '1px solid rgba(184,134,11,0.07)',
            boxShadow: '0 0 0 16px rgba(184,134,11,0.04), 0 0 0 32px rgba(184,134,11,0.03), 0 0 0 48px rgba(184,134,11,0.02)',
            opacity: 0.8,
          }}
        />

        <div className="relative z-10 px-10 py-10 md:px-16 md:py-12">

          {/* ── Header band ── */}
          <div className="cert-animate text-center mb-6">
            {/* HEART HT Logo */}
            <div className="flex justify-center mb-3">
              <img
                src="/images/logo/heartht-logo-70x70.png"
                alt="HEART HT"
                style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
            </div>
            <p
              className="cert-title text-[11px] tracking-[0.35em] uppercase mb-2"
              style={{ color: '#8a6914' }}
            >
              {certificate.issuer_name}
            </p>
            {/* Gold rule with diamond */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
              <div
                className="w-2 h-2 rotate-45 flex-shrink-0"
                style={{ background: '#c9a84c' }}
              />
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
            </div>
            <h1
              className="cert-title text-2xl md:text-3xl tracking-[0.15em] uppercase"
              style={{ color: '#5c3d0a', letterSpacing: '0.2em' }}
            >
              Certificate of Completion
            </h1>
          </div>

          {/* ── Thin divider ── */}
          <div className="flex items-center justify-center gap-2 mb-8 cert-animate">
            <div className="h-px w-16" style={{ background: 'rgba(184,134,11,0.3)' }} />
            <div className="text-[10px] tracking-widest uppercase cert-body" style={{ color: 'rgba(180,140,60,0.6)' }}>✦</div>
            <div className="h-px w-16" style={{ background: 'rgba(184,134,11,0.3)' }} />
          </div>

          {/* ── Main recipient block ── */}
          <div className="text-center mb-8 cert-animate-2">
            <p
              className="cert-body text-sm italic tracking-wide mb-4"
              style={{ color: '#7a5c2e', fontSize: '1rem' }}
            >
              This is to certify that
            </p>
            <h2
              className="cert-name font-semibold italic mb-1 leading-tight"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: '#2c1a08',
                textShadow: '0 1px 2px rgba(180,140,60,0.15)',
                letterSpacing: '-0.01em',
              }}
            >
              {certificate.user_name}
            </h2>
            <div className="flex items-center justify-center gap-3 my-5">
              <div className="h-px w-24" style={{ background: 'linear-gradient(to right, transparent, rgba(184,134,11,0.5))' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
              <div className="h-px w-24" style={{ background: 'linear-gradient(to left, transparent, rgba(184,134,11,0.5))' }} />
            </div>
            <p
              className="cert-body text-sm italic mb-3"
              style={{ color: '#7a5c2e', fontSize: '0.95rem' }}
            >
              has successfully completed the course
            </p>
            <h3
              className="cert-title font-medium mb-2 mx-auto leading-snug"
              style={{
                color: '#3d1f00',
                fontSize: 'clamp(0.95rem, 2.5vw, 1.35rem)',
                maxWidth: '580px',
                letterSpacing: '0.04em',
              }}
            >
              {certificate.course_title}
            </h3>
          </div>

          {/* ── Level badge ── */}
          <div className="flex justify-center mb-8 cert-animate-3">
            <div
              data-pdf-stat
              className="text-center py-3 px-10"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(184,134,11,0.2)',
                borderRadius: '2px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <p
                className="cert-title text-[9px] uppercase tracking-widest mb-1.5"
                style={{ color: '#9a7840' }}
              >
                Level
              </p>
              <p
                className="cert-name font-semibold"
                style={{ color: '#3d1f00', fontSize: '1.25rem' }}
              >
                {levelLabel}
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-6"
            style={{ borderTop: '1px solid rgba(184,134,11,0.2)' }}
          >
            {/* Issuer signature */}
            <div className="cert-animate-3">
              <p
                className="cert-name italic mb-1"
                style={{ color: '#5c3d0a', fontSize: '0.9rem', fontWeight: 600 }}
              >
                {certificate.issuer_name}
              </p>
              <div
                className="h-px mb-1"
                style={{ width: '110px', background: 'rgba(184,134,11,0.4)' }}
              />
              <p
                className="cert-title text-[9px] uppercase tracking-widest"
                style={{ color: '#9a7840' }}
              >
                {certificate.issuer_title}
              </p>
            </div>

            {/* Official seal with verification */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2 cert-animate-3">
              {/* Wax-seal ring element */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: '72px', height: '72px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 36%, rgba(220,180,80,0.55), rgba(180,134,11,0.75))',
                  border: '2px solid #c9a84c',
                  boxShadow: '0 0 0 3px rgba(255,255,255,0.8), 0 0 0 5px rgba(184,134,11,0.2), 2px 4px 12px rgba(0,0,0,0.12)',
                }}
              >
                <div
                  style={{
                    width: '52px', height: '52px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <CheckCircle
                    style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.9)', marginBottom: '1px' }}
                  />
                  <p
                    className="cert-title text-[7px] uppercase tracking-wide text-center"
                    style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}
                  >
                    Verified
                  </p>
                </div>
              </div>

              {/* Issue date + cert number */}
              <div className="text-center">
                <p
                  className="cert-body text-[10px] italic"
                  style={{ color: '#7a5c2e' }}
                >
                  {formatDate(certificate.issue_date)}
                </p>
                <p
                  className="font-mono text-[9px] tracking-widest mt-0.5"
                  style={{ color: 'rgba(184,134,11,0.6)' }}
                >
                  {certificate.certificate_number}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Actions ─── */}
      {showActions && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleDownload}
            loading={downloading}
            disabled={downloading}
            variant="primary"
          >
            {t('certificates.downloadPDF')}
          </Button>
        </div>
      )}

      {/* ─── Revoked warning ─── */}
      {!certificate.is_active && (
        <div className="mt-6 p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
          <p className="text-destructive font-semibold">This certificate has been revoked</p>
          {certificate.revoke_reason && (
            <p className="text-destructive text-sm mt-1">Reason: {certificate.revoke_reason}</p>
          )}
        </div>
      )}
    </Container>
  );
}
