export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      absensi_asn: {
        Row: {
          catatan: string | null
          created_at: string
          device_fingerprint_hash: string | null
          device_info: string | null
          foto_url: string | null
          id: string
          is_late: boolean
          lat: number | null
          late_minutes: number
          lng: number | null
          lokasi: string | null
          opd_id: string | null
          schedule_id: string | null
          tipe: string
          user_id: string
          waktu: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          device_fingerprint_hash?: string | null
          device_info?: string | null
          foto_url?: string | null
          id?: string
          is_late?: boolean
          lat?: number | null
          late_minutes?: number
          lng?: number | null
          lokasi?: string | null
          opd_id?: string | null
          schedule_id?: string | null
          tipe: string
          user_id: string
          waktu?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          device_fingerprint_hash?: string | null
          device_info?: string | null
          foto_url?: string | null
          id?: string
          is_late?: boolean
          lat?: number | null
          late_minutes?: number
          lng?: number | null
          lokasi?: string | null
          opd_id?: string | null
          schedule_id?: string | null
          tipe?: string
          user_id?: string
          waktu?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_asn_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absensi_asn_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_setting: {
        Row: {
          category: string
          key: string
          public_visible: boolean
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          key: string
          public_visible?: boolean
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          key?: string
          public_visible?: boolean
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      aset: {
        Row: {
          catatan: string | null
          created_at: string
          deskripsi: string | null
          dokumen_kehilangan_url: string | null
          foto_url: string | null
          garansi_sampai: string | null
          id: string
          kalibrasi_berikut: string | null
          kategori: string | null
          kib: string | null
          kode: string
          kondisi: string
          last_verified_at: string | null
          lat: number | null
          lifecycle_status: string | null
          lng: number | null
          lokasi: string | null
          lokasi_terkini: string | null
          merk: string | null
          metode_susut: string | null
          nama: string
          nilai_perolehan: number | null
          nilai_sisa: number | null
          nomor_seri: string | null
          opd_id: string | null
          pemegang_user_id: string | null
          qr_token: string | null
          status: string
          tanggal_perolehan: string | null
          umur_ekonomis_bulan: number | null
          updated_at: string
          version_number: number
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          deskripsi?: string | null
          dokumen_kehilangan_url?: string | null
          foto_url?: string | null
          garansi_sampai?: string | null
          id?: string
          kalibrasi_berikut?: string | null
          kategori?: string | null
          kib?: string | null
          kode: string
          kondisi?: string
          last_verified_at?: string | null
          lat?: number | null
          lifecycle_status?: string | null
          lng?: number | null
          lokasi?: string | null
          lokasi_terkini?: string | null
          merk?: string | null
          metode_susut?: string | null
          nama: string
          nilai_perolehan?: number | null
          nilai_sisa?: number | null
          nomor_seri?: string | null
          opd_id?: string | null
          pemegang_user_id?: string | null
          qr_token?: string | null
          status?: string
          tanggal_perolehan?: string | null
          umur_ekonomis_bulan?: number | null
          updated_at?: string
          version_number?: number
        }
        Update: {
          catatan?: string | null
          created_at?: string
          deskripsi?: string | null
          dokumen_kehilangan_url?: string | null
          foto_url?: string | null
          garansi_sampai?: string | null
          id?: string
          kalibrasi_berikut?: string | null
          kategori?: string | null
          kib?: string | null
          kode?: string
          kondisi?: string
          last_verified_at?: string | null
          lat?: number | null
          lifecycle_status?: string | null
          lng?: number | null
          lokasi?: string | null
          lokasi_terkini?: string | null
          merk?: string | null
          metode_susut?: string | null
          nama?: string
          nilai_perolehan?: number | null
          nilai_sisa?: number | null
          nomor_seri?: string | null
          opd_id?: string | null
          pemegang_user_id?: string | null
          qr_token?: string | null
          status?: string
          tanggal_perolehan?: string | null
          umur_ekonomis_bulan?: number | null
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "aset_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_pemegang_user_id_fkey"
            columns: ["pemegang_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_bast: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          catatan: string | null
          created_at: string
          created_by: string | null
          id: string
          nomor: string
          opd_id: string | null
          pemberi_user: string | null
          penerima_user: string | null
          status: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nomor: string
          opd_id?: string | null
          pemberi_user?: string | null
          penerima_user?: string | null
          status?: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nomor?: string
          opd_id?: string | null
          pemberi_user?: string | null
          penerima_user?: string | null
          status?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aset_bast_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_bast_items: {
        Row: {
          aset_id: string
          bast_id: string
          created_at: string
          id: string
        }
        Insert: {
          aset_id: string
          bast_id: string
          created_at?: string
          id?: string
        }
        Update: {
          aset_id?: string
          bast_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aset_bast_items_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_bast_items_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_bast_items_bast_id_fkey"
            columns: ["bast_id"]
            isOneToOne: false
            referencedRelation: "aset_bast"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_mutasi: {
        Row: {
          alasan: string | null
          approved_at: string | null
          approved_by: string | null
          aset_id: string
          catatan: string | null
          catatan_approval: string | null
          created_at: string
          dari_opd: string | null
          dari_user: string | null
          diajukan_oleh: string | null
          id: string
          ke_opd: string | null
          ke_user: string | null
          status: string
          ttd_url: string | null
          updated_at: string
        }
        Insert: {
          alasan?: string | null
          approved_at?: string | null
          approved_by?: string | null
          aset_id: string
          catatan?: string | null
          catatan_approval?: string | null
          created_at?: string
          dari_opd?: string | null
          dari_user?: string | null
          diajukan_oleh?: string | null
          id?: string
          ke_opd?: string | null
          ke_user?: string | null
          status?: string
          ttd_url?: string | null
          updated_at?: string
        }
        Update: {
          alasan?: string | null
          approved_at?: string | null
          approved_by?: string | null
          aset_id?: string
          catatan?: string | null
          catatan_approval?: string | null
          created_at?: string
          dari_opd?: string | null
          dari_user?: string | null
          diajukan_oleh?: string | null
          id?: string
          ke_opd?: string | null
          ke_user?: string | null
          status?: string
          ttd_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aset_mutasi_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_mutasi_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_mutasi_dari_opd_fkey"
            columns: ["dari_opd"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_mutasi_ke_opd_fkey"
            columns: ["ke_opd"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_opname: {
        Row: {
          catatan: string | null
          closed_at: string | null
          created_at: string
          dibuat_oleh: string | null
          ditutup_oleh: string | null
          id: string
          opd_id: string | null
          periode: string
          status: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          closed_at?: string | null
          created_at?: string
          dibuat_oleh?: string | null
          ditutup_oleh?: string | null
          id?: string
          opd_id?: string | null
          periode: string
          status?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          closed_at?: string | null
          created_at?: string
          dibuat_oleh?: string | null
          ditutup_oleh?: string | null
          id?: string
          opd_id?: string | null
          periode?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aset_opname_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_opname_items: {
        Row: {
          aset_id: string
          catatan: string | null
          created_at: string
          hadir: boolean | null
          id: string
          kondisi_temuan: string | null
          opname_id: string
          verified_at: string | null
        }
        Insert: {
          aset_id: string
          catatan?: string | null
          created_at?: string
          hadir?: boolean | null
          id?: string
          kondisi_temuan?: string | null
          opname_id: string
          verified_at?: string | null
        }
        Update: {
          aset_id?: string
          catatan?: string | null
          created_at?: string
          hadir?: boolean | null
          id?: string
          kondisi_temuan?: string | null
          opname_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aset_opname_items_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_opname_items_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_opname_items_opname_id_fkey"
            columns: ["opname_id"]
            isOneToOne: false
            referencedRelation: "aset_opname"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_pemeliharaan: {
        Row: {
          aset_id: string
          biaya: number | null
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          jadwal: string | null
          jenis: string | null
          opd_id: string | null
          selesai_at: string | null
          status: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          aset_id: string
          biaya?: number | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jadwal?: string | null
          jenis?: string | null
          opd_id?: string | null
          selesai_at?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          aset_id?: string
          biaya?: number | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jadwal?: string | null
          jenis?: string | null
          opd_id?: string | null
          selesai_at?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aset_pemeliharaan_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_pemeliharaan_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_pemeliharaan_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_penyusutan_history: {
        Row: {
          akumulasi: number
          aset_id: string
          created_at: string
          id: string
          nilai_buku: number
          periode: string
          susut_bulan: number
        }
        Insert: {
          akumulasi?: number
          aset_id: string
          created_at?: string
          id?: string
          nilai_buku?: number
          periode: string
          susut_bulan?: number
        }
        Update: {
          akumulasi?: number
          aset_id?: string
          created_at?: string
          id?: string
          nilai_buku?: number
          periode?: string
          susut_bulan?: number
        }
        Relationships: [
          {
            foreignKeyName: "aset_penyusutan_history_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_penyusutan_history_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_riwayat: {
        Row: {
          aksi: string
          aset_id: string
          catatan: string | null
          created_at: string
          data: Json | null
          id: string
          lat: number | null
          lng: number | null
          lokasi_text: string | null
          oleh: string | null
        }
        Insert: {
          aksi: string
          aset_id: string
          catatan?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          lokasi_text?: string | null
          oleh?: string | null
        }
        Update: {
          aksi?: string
          aset_id?: string
          catatan?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          lokasi_text?: string | null
          oleh?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aset_riwayat_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_riwayat_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_riwayat_oleh_fkey"
            columns: ["oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_verification_campaign: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          nama: string
          opd_id: string | null
          periode_mulai: string | null
          periode_selesai: string | null
          status: string
          target_opd_ids: string[]
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          nama: string
          opd_id?: string | null
          periode_mulai?: string | null
          periode_selesai?: string | null
          status?: string
          target_opd_ids?: string[]
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          nama?: string
          opd_id?: string | null
          periode_mulai?: string | null
          periode_selesai?: string | null
          status?: string
          target_opd_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aset_verification_campaign_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      aset_verification_item: {
        Row: {
          aset_id: string
          campaign_id: string
          catatan: string | null
          created_at: string
          foto_url: string | null
          id: string
          kondisi: string | null
          lat: number | null
          lng: number | null
          lokasi_text: string | null
          opd_id: string | null
          status: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          aset_id: string
          campaign_id: string
          catatan?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          kondisi?: string | null
          lat?: number | null
          lng?: number | null
          lokasi_text?: string | null
          opd_id?: string | null
          status?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          aset_id?: string
          campaign_id?: string
          catatan?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          kondisi?: string | null
          lat?: number | null
          lng?: number | null
          lokasi_text?: string | null
          opd_id?: string | null
          status?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aset_verification_item_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_verification_item_aset_id_fkey"
            columns: ["aset_id"]
            isOneToOne: false
            referencedRelation: "aset_nilai_buku"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_verification_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "aset_verification_campaign"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aset_verification_item_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_shift_assignment: {
        Row: {
          aktif: boolean
          created_at: string
          created_by: string | null
          dari: string
          id: string
          sampai: string | null
          shift_id: string
          user_id: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          created_by?: string | null
          dari: string
          id?: string
          sampai?: string | null
          shift_id: string
          user_id: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          created_by?: string | null
          dari?: string
          id?: string
          sampai?: string | null
          shift_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_shift_assignment_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "attendance_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_shifts: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          jam_masuk: string
          jam_pulang: string
          jenis: string
          nama: string
          opd_id: string | null
          toleransi_menit: number
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          jam_masuk: string
          jam_pulang: string
          jenis?: string
          nama: string
          opd_id?: string | null
          toleransi_menit?: number
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          jam_masuk?: string
          jam_pulang?: string
          jenis?: string
          nama?: string
          opd_id?: string | null
          toleransi_menit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_shifts_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          actor_id: string | null
          aksi: string
          correlation_id: string | null
          created_at: string
          data_sebelum: Json | null
          data_sesudah: Json | null
          entitas: string
          entitas_id: string | null
          id: string
          ip_address: string | null
          request_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          aksi: string
          correlation_id?: string | null
          created_at?: string
          data_sebelum?: Json | null
          data_sesudah?: Json | null
          entitas: string
          entitas_id?: string | null
          id?: string
          ip_address?: string | null
          request_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          aksi?: string
          correlation_id?: string | null
          created_at?: string
          data_sebelum?: Json | null
          data_sesudah?: Json | null
          entitas?: string
          entitas_id?: string | null
          id?: string
          ip_address?: string | null
          request_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_snapshot: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          label: string
          size_bytes: number
          table_counts: Json
          tipe: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          label: string
          size_bytes?: number
          table_counts?: Json
          tipe?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          label?: string
          size_bytes?: number
          table_counts?: Json
          tipe?: string
        }
        Relationships: []
      }
      berita: {
        Row: {
          created_at: string
          gambar_url: string | null
          id: string
          isi: string
          judul: string
          penulis_id: string | null
          published_at: string | null
          ringkasan: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gambar_url?: string | null
          id?: string
          isi?: string
          judul: string
          penulis_id?: string | null
          published_at?: string | null
          ringkasan?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gambar_url?: string | null
          id?: string
          isi?: string
          judul?: string
          penulis_id?: string | null
          published_at?: string | null
          ringkasan?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_checklist: {
        Row: {
          bukti_url: string | null
          catatan: string | null
          created_at: string
          deskripsi: string | null
          domain: string
          id: string
          judul: string | null
          kode: string
          label: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bukti_url?: string | null
          catatan?: string | null
          created_at?: string
          deskripsi?: string | null
          domain: string
          id?: string
          judul?: string | null
          kode: string
          label: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bukti_url?: string | null
          catatan?: string | null
          created_at?: string
          deskripsi?: string | null
          domain?: string
          id?: string
          judul?: string | null
          kode?: string
          label?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      consent_log: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          id?: string
          user_id: string
          version?: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      cron_history: {
        Row: {
          affected_rows: number | null
          created_at: string
          detail: Json | null
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          job_name: string
          meta: Json | null
          request_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          affected_rows?: number | null
          created_at?: string
          detail?: Json | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          meta?: Json | null
          request_id?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          affected_rows?: number | null
          created_at?: string
          detail?: Json | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          meta?: Json | null
          request_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      data_terpadu_item: {
        Row: {
          aktif: boolean
          created_at: string
          format: string | null
          id: string
          ikon: string | null
          kategori: string
          label: string
          nilai_num: number | null
          nilai_num2: number | null
          nilai_teks: string | null
          opd: string | null
          satuan: string | null
          trend: string | null
          ukuran: string | null
          updated_at: string
          url: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          format?: string | null
          id?: string
          ikon?: string | null
          kategori: string
          label: string
          nilai_num?: number | null
          nilai_num2?: number | null
          nilai_teks?: string | null
          opd?: string | null
          satuan?: string | null
          trend?: string | null
          ukuran?: string | null
          updated_at?: string
          url?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          format?: string | null
          id?: string
          ikon?: string | null
          kategori?: string
          label?: string
          nilai_num?: number | null
          nilai_num2?: number | null
          nilai_teks?: string | null
          opd?: string | null
          satuan?: string | null
          trend?: string | null
          ukuran?: string | null
          updated_at?: string
          url?: string | null
          urutan?: number
        }
        Relationships: []
      }
      dataset_submission: {
        Row: {
          catatan_review: string | null
          created_at: string
          data: Json
          id: string
          oleh_user_id: string | null
          opd_id: string | null
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          catatan_review?: string | null
          created_at?: string
          data?: Json
          id?: string
          oleh_user_id?: string | null
          opd_id?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          catatan_review?: string | null
          created_at?: string
          data?: Json
          id?: string
          oleh_user_id?: string | null
          opd_id?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_submission_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_submission_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "dataset_template"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_submission_review: {
        Row: {
          action: string
          aksi: string | null
          catatan: string | null
          created_at: string
          id: string
          reviewer_id: string
          submission_id: string
        }
        Insert: {
          action: string
          aksi?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          reviewer_id: string
          submission_id: string
        }
        Update: {
          action?: string
          aksi?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          reviewer_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_submission_review_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "dataset_submission"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_template: {
        Row: {
          aktif: boolean
          allow_multiple_submit: boolean
          created_at: string
          created_by: string | null
          deadline: string | null
          deskripsi: string | null
          excel_layout: Json | null
          id: string
          judul: string
          kode: string | null
          kolom: Json
          opd_id: string | null
          opd_pemilik_id: string | null
          target_opd_ids: string[] | null
          target_role: string
          target_scope: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          allow_multiple_submit?: boolean
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deskripsi?: string | null
          excel_layout?: Json | null
          id?: string
          judul: string
          kode?: string | null
          kolom?: Json
          opd_id?: string | null
          opd_pemilik_id?: string | null
          target_opd_ids?: string[] | null
          target_role?: string
          target_scope?: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          allow_multiple_submit?: boolean
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deskripsi?: string | null
          excel_layout?: Json | null
          id?: string
          judul?: string
          kode?: string | null
          kolom?: Json
          opd_id?: string | null
          opd_pemilik_id?: string | null
          target_opd_ids?: string[] | null
          target_role?: string
          target_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_template_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      dead_letter_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          failed_at: string
          id: string
          job_name: string
          payload: Json | null
          replayed_to: string | null
          request_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          failed_at?: string
          id?: string
          job_name: string
          payload?: Json | null
          replayed_to?: string | null
          request_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          failed_at?: string
          id?: string
          job_name?: string
          payload?: Json | null
          replayed_to?: string | null
          request_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
        }
        Relationships: []
      }
      desa: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          kecamatan: string | null
          nama: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          kecamatan?: string | null
          nama: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          kecamatan?: string | null
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_signatures: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          revoked_at: string | null
          signature_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          signature_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          signature_path?: string
          user_id?: string
        }
        Relationships: []
      }
      document_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          document_id: string
          id: string
          ip_hash: string | null
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          document_id: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          document_id?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          document_type: string
          file_path: string
          generated_by_system: boolean
          id: string
          opd_id: string | null
          source_module: string | null
          source_ref_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_type: string
          file_path: string
          generated_by_system?: boolean
          id?: string
          opd_id?: string | null
          source_module?: string | null
          source_ref_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_type?: string
          file_path?: string
          generated_by_system?: boolean
          id?: string
          opd_id?: string | null
          source_module?: string | null
          source_ref_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      dokumen_verifikasi: {
        Row: {
          created_at: string
          created_by: string | null
          diterbitkan_oleh: string | null
          hash: string | null
          id: string
          jenis: string | null
          nomor_surat: string | null
          permohonan_id: string | null
          sha256: string | null
          signature_provider: string | null
          size_bytes: number | null
          storage_path: string
          token: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          diterbitkan_oleh?: string | null
          hash?: string | null
          id?: string
          jenis?: string | null
          nomor_surat?: string | null
          permohonan_id?: string | null
          sha256?: string | null
          signature_provider?: string | null
          size_bytes?: number | null
          storage_path: string
          token?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          diterbitkan_oleh?: string | null
          hash?: string | null
          id?: string
          jenis?: string | null
          nomor_surat?: string | null
          permohonan_id?: string | null
          sha256?: string | null
          signature_provider?: string | null
          size_bytes?: number | null
          storage_path?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dokumen_verifikasi_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dokumen_verifikasi_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_config: {
        Row: {
          action: string
          aktif: boolean
          created_at: string
          id: string
          layanan_id: string | null
          level: number
          opd_id: string | null
          target_role: string
          target_user_id: string | null
          threshold_days: number
          threshold_hours: number
          updated_at: string
        }
        Insert: {
          action?: string
          aktif?: boolean
          created_at?: string
          id?: string
          layanan_id?: string | null
          level?: number
          opd_id?: string | null
          target_role?: string
          target_user_id?: string | null
          threshold_days?: number
          threshold_hours?: number
          updated_at?: string
        }
        Update: {
          action?: string
          aktif?: boolean
          created_at?: string
          id?: string
          layanan_id?: string | null
          level?: number
          opd_id?: string | null
          target_role?: string
          target_user_id?: string | null
          threshold_days?: number
          threshold_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_config_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          flag_key: string | null
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          flag_key?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          flag_key?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      form_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          due_at: string | null
          form_id: string
          id: string
          opd_id: string | null
          status: string
          updated_at: string
          user_id: string | null
          version_number: number
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          due_at?: string | null
          form_id: string
          id?: string
          opd_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          version_number?: number
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          due_at?: string | null
          form_id?: string
          id?: string
          opd_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_assignments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_assignments_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string
          form_id: string
          help: string | null
          help_text: string | null
          id: string
          kode: string
          label: string
          options: Json | null
          placeholder: string | null
          required: boolean
          tipe: string
          urutan: number
          validation: Json | null
          visible_if: Json | null
        }
        Insert: {
          created_at?: string
          form_id: string
          help?: string | null
          help_text?: string | null
          id?: string
          kode: string
          label: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean
          tipe?: string
          urutan?: number
          validation?: Json | null
          visible_if?: Json | null
        }
        Update: {
          created_at?: string
          form_id?: string
          help?: string | null
          help_text?: string | null
          id?: string
          kode?: string
          label?: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean
          tipe?: string
          urutan?: number
          validation?: Json | null
          visible_if?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_comment: {
        Row: {
          created_at: string
          id: string
          internal_only: boolean
          oleh: string | null
          pesan: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal_only?: boolean
          oleh?: string | null
          pesan: string
          submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internal_only?: boolean
          oleh?: string | null
          pesan?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_comment_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_files: {
        Row: {
          cleanup_status: string | null
          created_at: string
          field_kode: string | null
          finalized_at: string | null
          id: string
          mime: string | null
          provider: string
          size_bytes: number | null
          storage_path: string
          submission_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          cleanup_status?: string | null
          created_at?: string
          field_kode?: string | null
          finalized_at?: string | null
          id?: string
          mime?: string | null
          provider?: string
          size_bytes?: number | null
          storage_path: string
          submission_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          cleanup_status?: string | null
          created_at?: string
          field_kode?: string | null
          finalized_at?: string | null
          id?: string
          mime?: string | null
          provider?: string
          size_bytes?: number | null
          storage_path?: string
          submission_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_versions: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          files: Json | null
          id: string
          submission_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          files?: Json | null
          id?: string
          submission_id: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          files?: Json | null
          id?: string
          submission_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_versions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          assignment_id: string | null
          created_at: string
          data: Json
          form_id: string
          id: string
          opd_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          schema_version_snapshot: Json | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string | null
          version_number: number
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          opd_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schema_version_snapshot?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          version_number?: number
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          opd_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schema_version_snapshot?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      form_targets: {
        Row: {
          created_at: string
          form_id: string
          id: string
          target_id: string | null
          target_type: string
          target_value: string | null
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          target_id?: string | null
          target_type: string
          target_value?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          target_id?: string | null
          target_type?: string
          target_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_targets_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          allow_multiple_submit: boolean
          archived_at: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          deskripsi: string | null
          id: string
          is_public: boolean
          judul: string
          opd_pemilik_id: string | null
          published_at: string | null
          published_by: string | null
          schema_snapshot: Json | null
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allow_multiple_submit?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deskripsi?: string | null
          id?: string
          is_public?: boolean
          judul: string
          opd_pemilik_id?: string | null
          published_at?: string | null
          published_by?: string | null
          schema_snapshot?: Json | null
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allow_multiple_submit?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deskripsi?: string | null
          id?: string
          is_public?: boolean
          judul?: string
          opd_pemilik_id?: string | null
          published_at?: string | null
          published_by?: string | null
          schema_snapshot?: Json | null
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_opd_pemilik_id_fkey"
            columns: ["opd_pemilik_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_audit: {
        Row: {
          created_at: string
          dist_m: number | null
          id: string
          lat: number | null
          lng: number | null
          opd_id: string | null
          radius_m: number | null
          reason: string | null
          user_id: string | null
          valid: boolean | null
        }
        Insert: {
          created_at?: string
          dist_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          opd_id?: string | null
          radius_m?: number | null
          reason?: string | null
          user_id?: string | null
          valid?: boolean | null
        }
        Update: {
          created_at?: string
          dist_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          opd_id?: string | null
          radius_m?: number | null
          reason?: string | null
          user_id?: string | null
          valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "geofence_audit_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      hari_libur: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          jenis: string
          nama: string
          nasional: boolean
          tanggal: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          jenis?: string
          nama: string
          nasional?: boolean
          tanggal: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          jenis?: string
          nama?: string
          nasional?: boolean
          tanggal?: string
        }
        Relationships: []
      }
      ikm_responses: {
        Row: {
          created_at: string
          id: string
          permohonan_id: string | null
          saran: string | null
          survey_id: string
          u1: number | null
          u2: number | null
          u3: number | null
          u4: number | null
          u5: number | null
          u6: number | null
          u7: number | null
          u8: number | null
          u9: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          permohonan_id?: string | null
          saran?: string | null
          survey_id: string
          u1?: number | null
          u2?: number | null
          u3?: number | null
          u4?: number | null
          u5?: number | null
          u6?: number | null
          u7?: number | null
          u8?: number | null
          u9?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          permohonan_id?: string | null
          saran?: string | null
          survey_id?: string
          u1?: number | null
          u2?: number | null
          u3?: number | null
          u4?: number | null
          u5?: number | null
          u6?: number | null
          u7?: number | null
          u8?: number | null
          u9?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ikm_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "ikm_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      ikm_surveys: {
        Row: {
          aktif: boolean
          created_at: string
          created_by: string | null
          id: string
          judul: string
          layanan_id: string | null
          mulai: string | null
          opd_id: string | null
          periode: string | null
          selesai: string | null
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          judul: string
          layanan_id?: string | null
          mulai?: string | null
          opd_id?: string | null
          periode?: string | null
          selesai?: string | null
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          judul?: string
          layanan_id?: string | null
          mulai?: string | null
          opd_id?: string | null
          periode?: string | null
          selesai?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ikm_surveys_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          created_at: string
          created_by: string | null
          error: string | null
          finished_at: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json
          result: Json | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          payload?: Json
          result?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          payload?: Json
          result?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: []
      }
      kantor_qr: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          label: string | null
          lat: number | null
          lng: number | null
          lokasi: string | null
          opd_id: string
          radius_m: number
          token: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          lokasi?: string | null
          opd_id: string
          radius_m?: number
          token: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          lokasi?: string | null
          opd_id?: string
          radius_m?: number
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kantor_qr_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: true
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      kategori_layanan: {
        Row: {
          aktif: boolean
          created_at: string
          deskripsi: string | null
          id: string
          nama: string
          sla_hari: number
          slug: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama: string
          sla_hari?: number
          slug: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama?: string
          sla_hari?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      laporan_masyarakat: {
        Row: {
          created_at: string
          ditangani_oleh: string | null
          email: string
          id: string
          kategori: string
          lokasi: string | null
          nama: string
          nik: string | null
          no_hp: string | null
          opd_id: string | null
          status: string
          tindak_lanjut: string | null
          updated_at: string
          uraian: string
        }
        Insert: {
          created_at?: string
          ditangani_oleh?: string | null
          email: string
          id?: string
          kategori: string
          lokasi?: string | null
          nama: string
          nik?: string | null
          no_hp?: string | null
          opd_id?: string | null
          status?: string
          tindak_lanjut?: string | null
          updated_at?: string
          uraian: string
        }
        Update: {
          created_at?: string
          ditangani_oleh?: string | null
          email?: string
          id?: string
          kategori?: string
          lokasi?: string | null
          nama?: string
          nik?: string | null
          no_hp?: string | null
          opd_id?: string | null
          status?: string
          tindak_lanjut?: string | null
          updated_at?: string
          uraian?: string
        }
        Relationships: [
          {
            foreignKeyName: "laporan_masyarakat_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      layanan_publik: {
        Row: {
          aktif: boolean
          alur: string | null
          created_at: string
          deskripsi: string | null
          id: string
          ikon: string | null
          judul: string
          opd_id: string | null
          persyaratan: string | null
          sla_hari: number
          slug: string
          updated_at: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          alur?: string | null
          created_at?: string
          deskripsi?: string | null
          id?: string
          ikon?: string | null
          judul: string
          opd_id?: string | null
          persyaratan?: string | null
          sla_hari?: number
          slug: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          alur?: string | null
          created_at?: string
          deskripsi?: string | null
          id?: string
          ikon?: string | null
          judul?: string
          opd_id?: string | null
          persyaratan?: string | null
          sla_hari?: number
          slug?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "layanan_publik_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          jenis: string
          kuota: number
          tahun: number
          terpakai: number
          updated_at: string
          user_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          jenis: string
          kuota?: number
          tahun: number
          terpakai?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          jenis?: string
          kuota?: number
          tahun?: number
          terpakai?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lokasi_gedung: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          nama: string
          opd_id: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          nama: string
          opd_id?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          nama?: string
          opd_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lokasi_gedung_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      lokasi_lantai: {
        Row: {
          created_at: string
          gedung_id: string
          id: string
          nama: string
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          gedung_id: string
          id?: string
          nama: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          gedung_id?: string
          id?: string
          nama?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "lokasi_lantai_gedung_id_fkey"
            columns: ["gedung_id"]
            isOneToOne: false
            referencedRelation: "lokasi_gedung"
            referencedColumns: ["id"]
          },
        ]
      }
      lokasi_ruangan: {
        Row: {
          created_at: string
          id: string
          kode: string | null
          lantai_id: string
          nama: string
          pic_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode?: string | null
          lantai_id: string
          nama: string
          pic_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kode?: string | null
          lantai_id?: string
          nama?: string
          pic_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lokasi_ruangan_lantai_id_fkey"
            columns: ["lantai_id"]
            isOneToOne: false
            referencedRelation: "lokasi_lantai"
            referencedColumns: ["id"]
          },
        ]
      }
      master_jabatan: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          kategori: string | null
          kode: string
          nama: string
          updated_at: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          kategori?: string | null
          kode: string
          nama: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          kategori?: string | null
          kode?: string
          nama?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: []
      }
      nomor_surat_issued: {
        Row: {
          created_at: string
          id: string
          issued_at: string
          issued_by: string | null
          nomor: string
          opd_id: string | null
          permohonan_id: string | null
          tahun: number
        }
        Insert: {
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          nomor: string
          opd_id?: string | null
          permohonan_id?: string | null
          tahun: number
        }
        Update: {
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          nomor?: string
          opd_id?: string | null
          permohonan_id?: string | null
          tahun?: number
        }
        Relationships: [
          {
            foreignKeyName: "nomor_surat_issued_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomor_surat_issued_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomor_surat_issued_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      nomor_surat_sequence: {
        Row: {
          created_at: string
          id: string
          last_number: number
          opd_id: string | null
          tahun: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_number?: number
          opd_id?: string | null
          tahun: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_number?: number
          opd_id?: string | null
          tahun?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomor_surat_sequence_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dibaca: boolean
          id: string
          judul: string
          link: string | null
          meta: Json | null
          tipe: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dibaca?: boolean
          id?: string
          judul: string
          link?: string | null
          meta?: Json | null
          tipe: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dibaca?: boolean
          id?: string
          judul?: string
          link?: string | null
          meta?: Json | null
          tipe?: string
          user_id?: string
        }
        Relationships: []
      }
      opd: {
        Row: {
          created_at: string
          id: string
          kategori: string[]
          nama: string
          nomor_surat_format: string | null
          nomor_surat_kode: string | null
          singkatan: string
        }
        Insert: {
          created_at?: string
          id?: string
          kategori?: string[]
          nama: string
          nomor_surat_format?: string | null
          nomor_surat_kode?: string | null
          singkatan: string
        }
        Update: {
          created_at?: string
          id?: string
          kategori?: string[]
          nama?: string
          nomor_surat_format?: string | null
          nomor_surat_kode?: string | null
          singkatan?: string
        }
        Relationships: []
      }
      overtime_requests: {
        Row: {
          alasan: string | null
          approved_at: string | null
          approved_by: string | null
          catatan_approval: string | null
          created_at: string
          id: string
          jam_mulai: string
          jam_selesai: string
          opd_id: string | null
          status: string
          tanggal: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alasan?: string | null
          approved_at?: string | null
          approved_by?: string | null
          catatan_approval?: string | null
          created_at?: string
          id?: string
          jam_mulai: string
          jam_selesai: string
          opd_id?: string | null
          status?: string
          tanggal: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alasan?: string | null
          approved_at?: string | null
          approved_by?: string | null
          catatan_approval?: string | null
          created_at?: string
          id?: string
          jam_mulai?: string
          jam_selesai?: string
          opd_id?: string | null
          status?: string
          tanggal?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_requests_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          bulan: number
          catatan: string | null
          created_at: string
          id: string
          locked_at: string | null
          locked_by: string | null
          opd_id: string | null
          tahun: number
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string
        }
        Insert: {
          bulan: number
          catatan?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          opd_id?: string | null
          tahun: number
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
        }
        Update: {
          bulan?: number
          catatan?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          opd_id?: string | null
          tahun?: number
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      pejabat: {
        Row: {
          aktif: boolean
          created_at: string
          foto_url: string | null
          id: string
          is_pimpinan: boolean
          jabatan: string
          nama: string
          pimpinan_type: string | null
          updated_at: string
          urutan: number
          user_id: string | null
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          foto_url?: string | null
          id?: string
          is_pimpinan?: boolean
          jabatan: string
          nama: string
          pimpinan_type?: string | null
          updated_at?: string
          urutan?: number
          user_id?: string | null
        }
        Update: {
          aktif?: boolean
          created_at?: string
          foto_url?: string | null
          id?: string
          is_pimpinan?: boolean
          jabatan?: string
          nama?: string
          pimpinan_type?: string | null
          updated_at?: string
          urutan?: number
          user_id?: string | null
        }
        Relationships: []
      }
      pengajuan_izin: {
        Row: {
          alasan: string | null
          approved_at: string | null
          approved_by: string | null
          catatan_approval: string | null
          created_at: string
          dari: string
          id: string
          jenis: string
          lampiran_url: string | null
          mengurangi_saldo: boolean
          opd_id: string | null
          saldo_terpotong: number
          sampai: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alasan?: string | null
          approved_at?: string | null
          approved_by?: string | null
          catatan_approval?: string | null
          created_at?: string
          dari: string
          id?: string
          jenis: string
          lampiran_url?: string | null
          mengurangi_saldo?: boolean
          opd_id?: string | null
          saldo_terpotong?: number
          sampai: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alasan?: string | null
          approved_at?: string | null
          approved_by?: string | null
          catatan_approval?: string | null
          created_at?: string
          dari?: string
          id?: string
          jenis?: string
          lampiran_url?: string | null
          mengurangi_saldo?: boolean
          opd_id?: string | null
          saldo_terpotong?: number
          sampai?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_izin_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          kategori: string
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          kategori?: string
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          kategori?: string
          label?: string
        }
        Relationships: []
      }
      permohonan: {
        Row: {
          atas_nama_hp: string | null
          atas_nama_nama: string | null
          atas_nama_nik: string | null
          current_disposition_id: string | null
          deskripsi: string | null
          dokumen_final_path: string | null
          id: string
          judul: string
          kategori: string
          kode: string
          nomor_surat: string | null
          opd_id: string
          pemohon_id: string
          petugas_id: string | null
          prioritas: string
          ringkasan: string | null
          sla_paused_at: string | null
          sla_total_pause_seconds: number | null
          status: Database["public"]["Enums"]["status_permohonan"]
          tanggal_masuk: string
          tenggat: string | null
          untuk_orang_lain: boolean
          updated_at: string
          wakil_ambil_nama: string | null
          wakil_ambil_nik: string | null
        }
        Insert: {
          atas_nama_hp?: string | null
          atas_nama_nama?: string | null
          atas_nama_nik?: string | null
          current_disposition_id?: string | null
          deskripsi?: string | null
          dokumen_final_path?: string | null
          id?: string
          judul: string
          kategori: string
          kode: string
          nomor_surat?: string | null
          opd_id: string
          pemohon_id: string
          petugas_id?: string | null
          prioritas?: string
          ringkasan?: string | null
          sla_paused_at?: string | null
          sla_total_pause_seconds?: number | null
          status?: Database["public"]["Enums"]["status_permohonan"]
          tanggal_masuk?: string
          tenggat?: string | null
          untuk_orang_lain?: boolean
          updated_at?: string
          wakil_ambil_nama?: string | null
          wakil_ambil_nik?: string | null
        }
        Update: {
          atas_nama_hp?: string | null
          atas_nama_nama?: string | null
          atas_nama_nik?: string | null
          current_disposition_id?: string | null
          deskripsi?: string | null
          dokumen_final_path?: string | null
          id?: string
          judul?: string
          kategori?: string
          kode?: string
          nomor_surat?: string | null
          opd_id?: string
          pemohon_id?: string
          petugas_id?: string | null
          prioritas?: string
          ringkasan?: string | null
          sla_paused_at?: string | null
          sla_total_pause_seconds?: number | null
          status?: Database["public"]["Enums"]["status_permohonan"]
          tanggal_masuk?: string
          tenggat?: string | null
          untuk_orang_lain?: boolean
          updated_at?: string
          wakil_ambil_nama?: string | null
          wakil_ambil_nik?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permohonan_current_disposition_id_fkey"
            columns: ["current_disposition_id"]
            isOneToOne: false
            referencedRelation: "submission_dispositions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permohonan_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      permohonan_berkas: {
        Row: {
          created_at: string
          id: string
          jenis: string | null
          nama_file: string | null
          permohonan_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jenis?: string | null
          nama_file?: string | null
          permohonan_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: string | null
          nama_file?: string | null
          permohonan_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permohonan_berkas_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permohonan_berkas_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      permohonan_rating: {
        Row: {
          created_at: string
          id: string
          komentar: string | null
          permohonan_id: string
          skor: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          komentar?: string | null
          permohonan_id: string
          skor: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          komentar?: string | null
          permohonan_id?: string
          skor?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permohonan_rating_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permohonan_rating_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      permohonan_riwayat: {
        Row: {
          aksi: string
          catatan: string | null
          created_at: string
          id: string
          oleh: string | null
          permohonan_id: string
        }
        Insert: {
          aksi: string
          catatan?: string | null
          created_at?: string
          id?: string
          oleh?: string | null
          permohonan_id: string
        }
        Update: {
          aksi?: string
          catatan?: string | null
          created_at?: string
          id?: string
          oleh?: string | null
          permohonan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permohonan_riwayat_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permohonan_riwayat_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alamat: string | null
          asn_type: string | null
          created_at: string
          desa: string | null
          foto_url: string | null
          golongan: string | null
          id: string
          jabatan: string | null
          jabatan_id: string | null
          nama_lengkap: string
          nik: string | null
          nip: string | null
          no_hp: string | null
          opd_id: string | null
          pangkat: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"] | null
          status: string
          system_position: string | null
          updated_at: string
          username: string | null
          verification_method: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          alamat?: string | null
          asn_type?: string | null
          created_at?: string
          desa?: string | null
          foto_url?: string | null
          golongan?: string | null
          id: string
          jabatan?: string | null
          jabatan_id?: string | null
          nama_lengkap?: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          opd_id?: string | null
          pangkat?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: string
          system_position?: string | null
          updated_at?: string
          username?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          alamat?: string | null
          asn_type?: string | null
          created_at?: string
          desa?: string | null
          foto_url?: string | null
          golongan?: string | null
          id?: string
          jabatan?: string | null
          jabatan_id?: string | null
          nama_lengkap?: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          opd_id?: string | null
          pangkat?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: string
          system_position?: string | null
          updated_at?: string
          username?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_jabatan_id_fkey"
            columns: ["jabatan_id"]
            isOneToOne: false
            referencedRelation: "master_jabatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscription: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limit: {
        Row: {
          bucket: string
          count: number
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          bucket?: string
          count?: number
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          count: number
          id: string
          last_hit_at: string
          scope: string
          subject: string
          window_start: string
        }
        Insert: {
          count?: number
          id?: string
          last_hit_at?: string
          scope: string
          subject: string
          window_start: string
        }
        Update: {
          count?: number
          id?: string
          last_hit_at?: string
          scope?: string
          subject?: string
          window_start?: string
        }
        Relationships: []
      }
      rbac_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      retention_policies: {
        Row: {
          enabled: boolean
          entity: string
          last_deleted_count: number
          last_run_at: string | null
          retention_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          entity: string
          last_deleted_count?: number
          last_run_at?: string | null
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          entity?: string
          last_deleted_count?: number
          last_run_at?: string | null
          retention_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      retry_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          job_name: string
          last_attempt_at: string | null
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          next_attempt_at: string | null
          next_run_at: string | null
          payload: Json | null
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_name: string
          last_attempt_at?: string | null
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          next_run_at?: string | null
          payload?: Json | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_name?: string
          last_attempt_at?: string | null
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          next_run_at?: string | null
          payload?: Json | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      signed_documents: {
        Row: {
          created_at: string
          document_hash: string
          document_id: string
          expires_at: string | null
          id: string
          revoke_reason: string | null
          revoked_at: string | null
          signed_at: string
          signed_by: string
          signed_file_path: string
          status: string
          verification_count: number
          verification_token: string
        }
        Insert: {
          created_at?: string
          document_hash: string
          document_id: string
          expires_at?: string | null
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          signed_at?: string
          signed_by: string
          signed_file_path: string
          status?: string
          verification_count?: number
          verification_token: string
        }
        Update: {
          created_at?: string
          document_hash?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          signed_at?: string
          signed_by?: string
          signed_file_path?: string
          status?: string
          verification_count?: number
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "signed_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      signing_certificates: {
        Row: {
          created_at: string
          expired_at: string | null
          full_name: string
          id: string
          is_active: boolean
          issued_at: string
          nip: string | null
          position: string | null
          public_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expired_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          issued_at?: string
          nip?: string | null
          position?: string | null
          public_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expired_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          issued_at?: string
          nip?: string | null
          position?: string | null
          public_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      submission_dispositions: {
        Row: {
          acted_at: string | null
          created_at: string
          from_user: string
          id: string
          level: string
          note: string | null
          permohonan_id: string
          status: string
          to_user: string
        }
        Insert: {
          acted_at?: string | null
          created_at?: string
          from_user: string
          id?: string
          level: string
          note?: string | null
          permohonan_id: string
          status?: string
          to_user: string
        }
        Update: {
          acted_at?: string | null
          created_at?: string
          from_user?: string
          id?: string
          level?: string
          note?: string | null
          permohonan_id?: string
          status?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_dispositions_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_dispositions_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_sla_events: {
        Row: {
          actor: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          event_type: string
          id: string
          permohonan_id: string
          reason: string | null
          started_at: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          event_type: string
          id?: string
          permohonan_id: string
          reason?: string | null
          started_at?: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          event_type?: string
          id?: string
          permohonan_id?: string
          reason?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_sla_events_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_sla_events_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "v_permohonan_overdue"
            referencedColumns: ["id"]
          },
        ]
      }
      uat_results: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          run_at: string
          run_by: string | null
          scenario_id: string
          status: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          run_at?: string
          run_by?: string | null
          scenario_id: string
          status: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          run_at?: string
          run_by?: string | null
          scenario_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "uat_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "uat_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      uat_scenarios: {
        Row: {
          code: string | null
          created_at: string
          description: string
          enabled: boolean
          expected: string | null
          id: string
          judul: string | null
          modul: string
          role: string
          steps: string[] | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description: string
          enabled?: boolean
          expected?: string | null
          id?: string
          judul?: string | null
          modul: string
          role: string
          steps?: string[] | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          enabled?: boolean
          expected?: string | null
          id?: string
          judul?: string | null
          modul?: string
          role?: string
          steps?: string[] | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted: boolean
          granted_by: string | null
          id: string
          permission_code: string
          reason: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_code: string
          reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_code?: string
          reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          action: string
          actor_id: string | null
          catatan: string | null
          created_at: string
          id: string
          meta: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      verification_token: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          used_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_schedule: {
        Row: {
          aktif: boolean
          created_at: string
          hari_kerja: number[]
          id: string
          jam_masuk: string
          jam_pulang: string
          nama: string
          opd_id: string | null
          toleransi_menit: number
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          hari_kerja?: number[]
          id?: string
          jam_masuk: string
          jam_pulang: string
          nama: string
          opd_id?: string | null
          toleransi_menit?: number
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          hari_kerja?: number[]
          id?: string
          jam_masuk?: string
          jam_pulang?: string
          nama?: string
          opd_id?: string | null
          toleransi_menit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedule_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedule_assignment: {
        Row: {
          berlaku_dari: string
          berlaku_sampai: string | null
          created_at: string
          id: string
          schedule_id: string
          user_id: string
        }
        Insert: {
          berlaku_dari?: string
          berlaku_sampai?: string | null
          created_at?: string
          id?: string
          schedule_id: string
          user_id: string
        }
        Update: {
          berlaku_dari?: string
          berlaku_sampai?: string | null
          created_at?: string
          id?: string
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedule_assignment_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      aset_nilai_buku: {
        Row: {
          id: string | null
          kode: string | null
          metode_susut: string | null
          nama: string | null
          nilai_buku: number | null
          nilai_perolehan: number | null
          opd_id: string | null
          tanggal_perolehan: string | null
          umur_ekonomis_bulan: number | null
        }
        Insert: {
          id?: string | null
          kode?: string | null
          metode_susut?: string | null
          nama?: string | null
          nilai_buku?: never
          nilai_perolehan?: number | null
          opd_id?: string | null
          tanggal_perolehan?: string | null
          umur_ekonomis_bulan?: number | null
        }
        Update: {
          id?: string | null
          kode?: string | null
          metode_susut?: string | null
          nama?: string | null
          nilai_buku?: never
          nilai_perolehan?: number | null
          opd_id?: string | null
          tanggal_perolehan?: string | null
          umur_ekonomis_bulan?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aset_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
      v_permohonan_overdue: {
        Row: {
          id: string | null
          kode: string | null
          opd_id: string | null
          overdue_days: number | null
          status: string | null
        }
        Insert: {
          id?: string | null
          kode?: string | null
          opd_id?: string | null
          overdue_days?: never
          status?: never
        }
        Update: {
          id?: string | null
          kode?: string | null
          opd_id?: string | null
          overdue_days?: never
          status?: never
        }
        Relationships: [
          {
            foreignKeyName: "permohonan_opd_id_fkey"
            columns: ["opd_id"]
            isOneToOne: false
            referencedRelation: "opd"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _lovable_request_uid: { Args: never; Returns: string }
      aset_compliance: { Args: { _opd_id?: string }; Returns: Json }
      aset_due_warranty: {
        Args: { _days?: number }
        Returns: {
          aset_id: string
          due_date: string
          jenis: string
          kode: string
          nama: string
          opd_id: string
        }[]
      }
      attendance_compliance: {
        Args: { _from: string; _to: string; _user_id: string }
        Returns: Json
      }
      attendance_device_alert: {
        Args: { _days?: number }
        Returns: {
          device_fingerprint_hash: string
          hit_count: number
          user_count: number
          user_ids: string[]
        }[]
      }
      attendance_rekap_bulanan: {
        Args: { _month: number; _user_id: string; _year: number }
        Returns: Json
      }
      check_signed_document_status: { Args: { _id: string }; Returns: string }
      count_permohonan_bulan_ini: { Args: never; Returns: number }
      executive_summary: { Args: never; Returns: Json }
      fn_approve_user: {
        Args: {
          _method?: string
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: Json
      }
      fn_generate_nomor_surat: {
        Args: { _opd_id: string; _permohonan_id: string }
        Returns: string
      }
      fn_ikm_dashboard: { Args: { _survey_id: string }; Returns: Json }
      fn_permohonan_effective_sla_seconds: {
        Args: { _id: string }
        Returns: number
      }
      fn_reject_user: {
        Args: { _reason: string; _target_user_id: string }
        Returns: Json
      }
      fn_retention_cleanup: { Args: never; Returns: Json }
      fn_susut_bulanan_run: { Args: { _periode: string }; Returns: Json }
      get_effective_permissions: {
        Args: { _user_id: string }
        Returns: {
          code: string
          permission_code: string
        }[]
      }
      get_user_desa: { Args: { _user_id: string }; Returns: string }
      get_user_opd: { Args: { _user_id: string }; Returns: string }
      governance_inventory: { Args: never; Returns: Json }
      governance_summary: { Args: never; Returns: Json }
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_pemda: { Args: { _uid: string }; Returns: boolean }
      is_bupati: { Args: { _uid: string }; Returns: boolean }
      is_elevated_view: { Args: { _uid: string }; Returns: boolean }
      is_executive: { Args: { _uid: string }; Returns: boolean }
      is_pemohon_in_admin_desa: {
        Args: { _admin_uid: string; _pemohon_id: string }
        Returns: boolean
      }
      is_pemohon_in_admin_opd: {
        Args: { _admin_uid: string; _pemohon_id: string }
        Returns: boolean
      }
      is_pimpinan: { Args: { _uid: string }; Returns: boolean }
      layanan_kinerja_agg: {
        Args: never
        Returns: {
          kategori: string
          layanan_id: string
          layanan_judul: string
          on_time: number
          opd_id: string
          opd_singkatan: string
          rata_hari_selesai: number
          selesai: number
          selesai_dengan_sla: number
          total: number
        }[]
      }
      migrasi_dataset_ke_forms: {
        Args: { _template_id: string }
        Returns: string
      }
      opd_attendance_today: { Args: { _opd_id?: string }; Returns: Json }
      opd_kategori_benchmark: {
        Args: { _kategori: string }
        Returns: {
          opd_id: string
          opd_nama: string
          opd_singkatan: string
          rating_avg: number
          selesai: number
          skor: number
          sla_pct: number
          total: number
        }[]
      }
      opd_kinerja_agg: {
        Args: never
        Returns: {
          jumlah_selesai: number
          opd_id: string
          selesai_dengan_sla: number
          status: string
          tepat_waktu: number
          total: number
          total_hari_selesai: number
        }[]
      }
      opd_kinerja_trend: {
        Args: { _months?: number; _opd?: string }
        Returns: {
          bulan: string
          masuk: number
          on_time: number
          selesai: number
          selesai_dengan_sla: number
        }[]
      }
      opd_rating_agg: {
        Args: never
        Returns: {
          jumlah_rating: number
          opd_id: string
          total_rating: number
        }[]
      }
      opd_skor_komposit: {
        Args: never
        Returns: {
          completion_pct: number
          kategori: string[]
          opd_id: string
          opd_nama: string
          opd_singkatan: string
          rating_avg: number
          selesai: number
          skor: number
          sla_pct: number
          total: number
        }[]
      }
      production_health_score: { Args: never; Returns: Json }
      rate_limit_increment: {
        Args: { _scope: string; _subject: string; _window_start: string }
        Returns: number
      }
      rating_list_admin: {
        Args: never
        Returns: {
          created_at: string
          komentar: string
          opd_id: string
          opd_nama: string
          opd_singkatan: string
          pemohon_nama: string
          permohonan_id: string
          permohonan_judul: string
          permohonan_kode: string
          rating_id: string
          skor: number
          user_id: string
        }[]
      }
      riwayat_dengan_petugas: {
        Args: { _permohonan_id: string }
        Returns: {
          aksi: string
          catatan: string
          created_at: string
          email_petugas: string
          id: string
          nama_petugas: string
          oleh: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "warga"
        | "admin_opd"
        | "super_admin"
        | "admin_desa"
        | "asn"
        | "admin_pemda"
        | "pimpinan"
      bast_status: "draft" | "issued" | "approved" | "cancelled"
      checklist_status: "todo" | "in_progress" | "done" | "na"
      izin_jenis:
        | "cuti_tahunan"
        | "cuti_sakit"
        | "dinas_luar"
        | "wfh"
        | "lainnya"
      izin_status: "pending" | "approved" | "rejected" | "dibatalkan"
      job_status: "pending" | "running" | "success" | "failed" | "dead"
      metode_susut: "garis_lurus" | "saldo_menurun"
      mutasi_status: "pending" | "approved" | "rejected" | "cancelled"
      retry_status:
        | "pending"
        | "retrying"
        | "success"
        | "dead_letter"
        | "cancelled"
      shift_jenis: "pagi" | "malam" | "khusus"
      sla_event_type: "pause" | "resume" | "reset"
      status_permohonan:
        | "baru"
        | "diproses"
        | "selesai"
        | "ditolak"
        | "menunggu_dokumen"
      submission_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "revision"
      uat_result_status: "pass" | "partial" | "fail"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "warga",
        "admin_opd",
        "super_admin",
        "admin_desa",
        "asn",
        "admin_pemda",
        "pimpinan",
      ],
      bast_status: ["draft", "issued", "approved", "cancelled"],
      checklist_status: ["todo", "in_progress", "done", "na"],
      izin_jenis: [
        "cuti_tahunan",
        "cuti_sakit",
        "dinas_luar",
        "wfh",
        "lainnya",
      ],
      izin_status: ["pending", "approved", "rejected", "dibatalkan"],
      job_status: ["pending", "running", "success", "failed", "dead"],
      metode_susut: ["garis_lurus", "saldo_menurun"],
      mutasi_status: ["pending", "approved", "rejected", "cancelled"],
      retry_status: [
        "pending",
        "retrying",
        "success",
        "dead_letter",
        "cancelled",
      ],
      shift_jenis: ["pagi", "malam", "khusus"],
      sla_event_type: ["pause", "resume", "reset"],
      status_permohonan: [
        "baru",
        "diproses",
        "selesai",
        "ditolak",
        "menunggu_dokumen",
      ],
      submission_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "revision",
      ],
      uat_result_status: ["pass", "partial", "fail"],
    },
  },
} as const
