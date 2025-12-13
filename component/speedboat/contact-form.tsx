'use client';

import React, { useEffect, useState } from 'react';
import { Paper, Stack, Title, Grid, TextInput, Select, NumberInput, Textarea, Checkbox, Group, Text, Anchor, ScrollArea, Modal } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

interface ContactFormProps {
  guestCount: number;
  onGuestCountChange: (value: number) => void;
  onChange?: (value: {
    firstName: string;
    lastName: string;
    email: string;
    countryCode: string;
    phone: string;
    specialRequests?: string;
    agreed?: boolean;
  }) => void;
  availableUnits?: number;
}

export function ContactForm({ guestCount, onGuestCountChange, onChange, availableUnits }: ContactFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreed, setAgreed] = useState(false);
  const emailError = email && (!email.includes('@') || !email.endsWith('.com')) ? 'Invalid email format' : undefined;
  const [modalOpened, setModalOpened] = useState(false)
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null)
  const openModal = (type: 'terms' | 'privacy') => { setModalType(type); setModalOpened(true) }
  const closeModal = () => { setModalOpened(false); setModalType(null) }

  useEffect(() => {
    if (onChange) {
      onChange({ firstName, lastName, email, countryCode, phone, specialRequests, agreed });
    }
  }, [firstName, lastName, email, countryCode, phone, specialRequests, agreed, onChange]);

  return (
    <Paper shadow="sm" p="xl" radius="lg" bg="white">
      <Stack gap="xl">
        <Title order={2} size="xl" fw={600} c="dark">Contact Information</Title>
        
        <Grid gutter="xl">
          <Modal
            opened={modalOpened}
                    onClose={closeModal}
                    title={modalType === 'terms' ? 'Terms of Service' : modalType === 'privacy' ? 'Privacy Policy' : ''}
                    size="lg"
                    centered
                    overlayProps={{ opacity: 0.5 }}
                  >
                    <ScrollArea style={{ height: 500 }}>
                      {modalType === 'terms' ? (
                        <Stack gap="md">
                          <Title order={3}>Syarat & Ketentuan BestTripGuide</Title>
                          <Text>Selamat datang di BestTripGuide, penyedia layanan pemesanan fastboat untuk perjalanan antar pulau. Dengan menggunakan layanan kami, Anda menyetujui Syarat & Ketentuan berikut.</Text>
                          <Title order={4}>1. Definisi</Title>
                          <Text>"Kami" mengacu pada BestTripGuide. "Pengguna" adalah pihak yang melakukan pemesanan melalui platform kami. "Operator" adalah penyedia layanan fastboat yang bekerja sama dengan kami.</Text>
                          <Title order={4}>2. Pemesanan & Pembayaran</Title>
                          <Text>Pemesanan dianggap berhasil setelah pembayaran terkonfirmasi. Metode pembayaran yang tersedia dapat berupa kartu, virtual account, atau QRIS. Harga dapat berubah sewaktu-waktu mengikuti kebijakan operator.</Text>
                          <Title order={4}>3. Batas Waktu Pembayaran</Title>
                          <Text>Setiap pemesanan memiliki batas waktu pembayaran 15 menit sejak pemesanan dibuat. Jika pembayaran tidak diterima dalam batas waktu, pemesanan dapat otomatis dibatalkan.</Text>
                          <Title order={4}>4. Perubahan Jadwal & Pembatalan</Title>
                          <Text>Operator dapat melakukan perubahan jadwal karena kondisi operasional atau cuaca. Kami akan berupaya memberi notifikasi. Pembatalan mengikuti kebijakan operator dan dapat dikenakan biaya.</Text>
                          <Title order={4}>5. Kelayakan Penumpang</Title>
                          <Text>Penumpang wajib memenuhi persyaratan keselamatan dan membawa identitas yang sah. Anak-anak harus didampingi sesuai aturan operator.</Text>
                          <Title order={4}>6. Tanggung Jawab</Title>
                          <Text>Kami bertindak sebagai platform pemesanan. Tanggung jawab operasional perjalanan berada pada operator. Kami tidak bertanggung jawab atas kehilangan atau kerusakan barang pribadi.</Text>
                          <Title order={4}>7. Kebijakan Refund</Title>
                          <Text>Refund tunduk pada kebijakan operator. Permohonan refund harus diajukan melalui halaman bantuan dan akan diproses sesuai ketentuan yang berlaku.</Text>
                          <Title order={4}>8. Privasi</Title>
                          <Text>Data Anda dikelola sesuai Privacy Policy BestTripGuide. Dengan memesan, Anda menyetujui pengolahan data untuk keperluan layanan.</Text>
                          <Title order={4}>9. Hukum yang Berlaku</Title>
                          <Text>Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia.</Text>
                        </Stack>
                      ) : modalType === 'privacy' ? (
                        <Stack gap="md">
                          <Title order={3}>Kebijakan Privasi BestTripGuide</Title>
                          <Text>Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan layanan BestTripGuide.</Text>
                          <Title order={4}>1. Data yang Dikumpulkan</Title>
                          <Text>Kami mengumpulkan nama, email, nomor telepon, detail pemesanan, serta data teknis seperti alamat IP dan informasi perangkat untuk peningkatan layanan.</Text>
                          <Title order={4}>2. Penggunaan Data</Title>
                          <Text>Data digunakan untuk memproses pemesanan, dukungan pelanggan, komunikasi terkait layanan, peningkatan fitur, serta kepatuhan terhadap regulasi.</Text>
                          <Title order={4}>3. Dasar Pemrosesan</Title>
                          <Text>Kami memproses data berdasarkan persetujuan, pelaksanaan kontrak, dan kepentingan yang sah untuk operasional platform.</Text>
                          <Title order={4}>4. Berbagi Data</Title>
                          <Text>Data dapat dibagikan dengan operator fastboat dan mitra pembayaran untuk menyelesaikan transaksi. Kami tidak menjual data pribadi kepada pihak ketiga.</Text>
                          <Title order={4}>5. Retensi</Title>
                          <Text>Data disimpan selama diperlukan untuk tujuan layanan dan sesuai ketentuan hukum yang berlaku.</Text>
                          <Title order={4}>6. Keamanan</Title>
                          <Text>Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data dari akses tidak sah.</Text>
                          <Title order={4}>7. Hak Pengguna</Title>
                          <Text>Anda berhak mengakses, memperbarui, atau menghapus data tertentu sesuai regulasi. Hubungi kami untuk permintaan terkait privasi.</Text>
                          <Title order={4}>8. Cookies</Title>
                          <Text>Kami menggunakan cookies untuk fungsi dasar, analitik, dan meningkatkan pengalaman pengguna.</Text>
                          <Title order={4}>9. Kontak</Title>
                          <Text>Untuk pertanyaan privasi, silakan hubungi info@name.com atau melalui halaman bantuan.</Text>
                        </Stack>
                      ) : null}
                    </ScrollArea>
                  </Modal>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={emailError}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text size="sm" fw={500} c="#374151">Phone Number</Text>
              <Group gap="sm">
                <Select
                  data={[
                    { value: '+62', label: '+62' },
                    { value: '+1', label: '+1' },
                    { value: '+44', label: '+44' },
                    { value: '+61', label: '+61' }
                  ]}
                  value={countryCode}
                  onChange={(v) => v && setCountryCode(v)}
                  rightSection={<IconChevronDown size={16} />}
                  styles={{
                    input: {
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      width: 80,
                      '&:focus': { 
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
                <TextInput
                  placeholder="Enter phone number"
                  required
                  style={{ flex: 1 }}
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  styles={{
                    input: {
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      '&:focus': { 
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Group>
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label="Number of Passengers"
              min={1}
              max={typeof availableUnits === 'number' ? availableUnits : undefined}
              value={guestCount}
              onChange={(value) => {
                const v = typeof value === 'number' ? value : 1;
                const max = typeof availableUnits === 'number' ? availableUnits : undefined;
                const next = max != null ? Math.min(Math.max(1, v), max) : Math.max(1, v);
                onGuestCountChange(next);
              }}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
        </Grid>
        
        <Textarea
          label="Special Requests (Optional)"
          placeholder="Any special requests or notes..."
          rows={4}
          resize="none"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.currentTarget.value)}
          styles={{
            label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
            input: {
              padding: '12px 16px',
              backgroundColor: 'white',
              color: '#111827',
              border: '1px solid #d1d5db',
              '&:focus': { 
                borderColor: '#284361',
                boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
              }
            }
          }}
        />
        
        <Checkbox
          label={
            <Text size="sm" c="dimmed">
              I agree to the{' '}
              <Anchor onClick={(e) => { e.preventDefault(); openModal('terms') }} c="#284361" td="hover">
                Terms and Conditions
              </Anchor>{' '}
              and{' '}
              <Anchor onClick={(e) => { e.preventDefault(); openModal('privacy') }} c="#284361" td="hover">
                Privacy Policy
              </Anchor>
            </Text>
          }
          checked={agreed}
          onChange={(e) => setAgreed(e.currentTarget.checked)}
          styles={{
            input: {
              '&:checked': { backgroundColor: '#284361', borderColor: '#284361' },
              '&:focus': { boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)' }
            }
          }}
        />
      </Stack>
    </Paper>
  );
}
