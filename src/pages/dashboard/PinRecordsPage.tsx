import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberWithPin {
  id: string;
  name: string;
  pin_display: string;
  created_at: string;
}

export default function PinRecordsPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (mess) {
      fetchMembersWithPins();
    }
  }, [mess]);

  const fetchMembersWithPins = async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      // Fetch members with their PINs from edge function
      const { data, error } = await supabase.functions.invoke('get-member-pins', {
        body: { messId: mess.id },
      });

      if (error) throw error;
      setMembers(data.members || []);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'পিন রেকর্ড' : 'PIN Records'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'সকল মেম্বারের পিন দেখুন' : 'View all member PINs'}
          </p>
        </div>

        {/* Warning Card */}
        <Card className="glass-card border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {language === 'bn' ? 'গোপনীয় তথ্য' : 'Sensitive Information'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn'
                    ? 'এই পিনগুলো শুধুমাত্র ম্যানেজার দেখতে পারবে। অন্যদের সাথে শেয়ার করবেন না।'
                    : 'These PINs are only visible to the manager. Do not share with others.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="max-w-sm">
          <Input
            placeholder={language === 'bn' ? 'মেম্বার খুঁজুন...' : 'Search members...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* PIN Records Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? language === 'bn' ? 'কোনো ফলাফল নেই' : 'No results found'
                    : language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'মেম্বার' : 'Member'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'পিন' : 'PIN'}</TableHead>
                      <TableHead>{language === 'bn' ? 'যোগ হয়েছে' : 'Added'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border"
                      >
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-center">
                          <code className="bg-muted px-3 py-1 rounded-lg text-lg font-mono">
                            {member.pin_display}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString(
                            language === 'bn' ? 'bn-BD' : 'en-US'
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
