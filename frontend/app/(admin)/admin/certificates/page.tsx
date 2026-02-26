'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Container } from '@/components/ui/Container';
import { SkeletonBox } from '@/components/ui/LoadingStates';
import { useAllCertificatesQuery, useRevokeCertificate } from '@/hooks/queries/useCertificates';
import { CertificateWithDetails } from '@/lib/types/certificate';
import {
  Award,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  AlertTriangle,
  User,
  BookOpen,
  Calendar,
  Hash,
} from 'lucide-react';

export default function AdminCertificatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<CertificateWithDetails | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const { data, loading: isLoading } = useAllCertificatesQuery({ per_page: 50 });
  const { mutate: revokeCertificate, loading: revoking } = useRevokeCertificate();

  const certificates: CertificateWithDetails[] = data?.data?.items || [];

  const filtered = certificates.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.user_name?.toLowerCase().includes(q) ||
      c.course_title?.toLowerCase().includes(q) ||
      c.certificate_number?.toLowerCase().includes(q) ||
      c.user_email?.toLowerCase().includes(q)
    );
  });

  const totalActive = certificates.filter((c) => c.is_active).length;
  const totalRevoked = certificates.filter((c) => !c.is_active).length;

  const handleRevoke = () => {
    if (!revokeTarget || !revokeReason.trim()) return;
    revokeCertificate(
      { certificateId: revokeTarget.id, reason: revokeReason.trim() },
      {
        onSuccess: () => {
          setRevokeTarget(null);
          setRevokeReason('');
        },
      }
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Container variant="admin">
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certificate Management</h1>
          <p className="text-muted-foreground">View and manage all issued certificates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Issued</p>
              {isLoading ? <SkeletonBox className="h-7 w-12 mt-1" /> : (
                <p className="text-2xl font-bold">{certificates.length}</p>
              )}
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              {isLoading ? <SkeletonBox className="h-7 w-12 mt-1" /> : (
                <p className="text-2xl font-bold text-success">{totalActive}</p>
              )}
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revoked</p>
              {isLoading ? <SkeletonBox className="h-7 w-12 mt-1" /> : (
                <p className="text-2xl font-bold text-destructive">{totalRevoked}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student name, course, certificate number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBox key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No certificates match your search' : 'No certificates issued yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Course</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Certificate #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Issued</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((cert) => (
                    <tr key={cert.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{cert.user_name}</p>
                            <p className="text-xs text-muted-foreground">{cert.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1">{cert.course_title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{cert.course_level}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{cert.certificate_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{cert.final_score.toFixed(0)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">{formatDate(cert.issue_date)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {cert.is_active ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="w-3 h-3" /> Revoked
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          {cert.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:border-destructive"
                              onClick={() => setRevokeTarget(cert)}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>

      {/* Revoke Modal */}
      {revokeTarget && (
        <Modal
          isOpen={!!revokeTarget}
          onClose={() => { setRevokeTarget(null); setRevokeReason(''); }}
          title="Revoke Certificate"
        >
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <p className="font-semibold mb-1">You are about to revoke:</p>
              <p><strong>{revokeTarget.user_name}</strong> — {revokeTarget.course_title}</p>
              <p className="font-mono text-xs mt-1">{revokeTarget.certificate_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Reason for revocation <span className="text-destructive">*</span>
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-destructive/20 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setRevokeTarget(null); setRevokeReason(''); }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleRevoke}
                disabled={!revokeReason.trim() || revoking}
                loading={revoking}
              >
                Revoke Certificate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Container>
  );
}
