-- ===== P1: Performance Indexes =====
CREATE INDEX IF NOT EXISTS idx_permohonan_opd_status_tanggal ON public.permohonan(opd_id, status, tanggal_masuk DESC);
CREATE INDEX IF NOT EXISTS idx_absensi_asn_user_waktu ON public.absensi_asn(user_id, waktu DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_status ON public.form_submissions(form_id, status);

CREATE INDEX IF NOT EXISTS idx_permohonan_pemohon ON public.permohonan(pemohon_id);
CREATE INDEX IF NOT EXISTS idx_permohonan_tenggat ON public.permohonan(tenggat) WHERE status <> 'selesai';
CREATE INDEX IF NOT EXISTS idx_permohonan_rating_permohonan ON public.permohonan_rating(permohonan_id);
CREATE INDEX IF NOT EXISTS idx_permohonan_riwayat_permohonan ON public.permohonan_riwayat(permohonan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permohonan_berkas_permohonan ON public.permohonan_berkas(permohonan_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entitas ON public.audit_log(entitas, entitas_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE dibaca = false;
CREATE INDEX IF NOT EXISTS idx_form_submission_files_submission ON public.form_submission_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_form ON public.form_fields(form_id, urutan);
CREATE INDEX IF NOT EXISTS idx_aset_opd ON public.aset(opd_id);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON public.laporan_masyarakat(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created ON public.verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_window ON public.rate_limit_hits(scope, subject, window_start);

-- ===== P1: Retention Policy Function =====
CREATE OR REPLACE FUNCTION public.fn_retention_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _audit int := 0; _verif int := 0; _rl int := 0; _notif int := 0;
BEGIN
  DELETE FROM public.audit_log WHERE created_at < now() - interval '365 days';
  GET DIAGNOSTICS _audit = ROW_COUNT;

  DELETE FROM public.verification_logs WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS _verif = ROW_COUNT;

  DELETE FROM public.rate_limit_hits WHERE last_hit_at < now() - interval '7 days';
  GET DIAGNOSTICS _rl = ROW_COUNT;

  DELETE FROM public.notifications WHERE dibaca = true AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS _notif = ROW_COUNT;

  RETURN jsonb_build_object('audit_log', _audit, 'verification_logs', _verif, 'rate_limit_hits', _rl, 'notifications', _notif, 'executed_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.fn_retention_cleanup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_retention_cleanup() TO service_role;

COMMENT ON FUNCTION public.fn_retention_cleanup() IS 'P1 retention: cleans audit_log (365d), verification_logs (180d), rate_limit_hits (7d), read notifications (90d).';
COMMENT ON TABLE public.audit_log IS 'Audit trail. Retention: 365 days (fn_retention_cleanup).';
COMMENT ON TABLE public.verification_logs IS 'QR/document verification log. Retention: 180 days.';