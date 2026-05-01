import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  DollarSign,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { employeeService } from '@/services/api';
import { toast } from 'sonner';

export default function Employees() {
  const [search, setSearch] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    role: 'waiter',
    department: '',
    base_salary: '',
    hourly_rate: '',
    email: '',
    phone: '',
  });
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day' | 'leave',
    hours_worked: '8',
    overtime_hours: '0',
  });
  const [salaryForm, setSalaryForm] = useState({
    employee_id: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => employeeService.getEmployees({ search: search || undefined }),
  });

  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: () => employeeService.getAttendance(),
  });

  const { data: salaries, isLoading: salaryLoading } = useQuery({
    queryKey: ['salary-records'],
    queryFn: () => employeeService.getSalaries(),
  });

  const addEmployeeMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddEmployeeOpen(false);
      setEmployeeForm({
        employee_code: '',
        first_name: '',
        last_name: '',
        role: 'waiter',
        department: '',
        base_salary: '',
        hourly_rate: '',
        email: '',
        phone: '',
      });
      toast.success('Employee added successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to add employee'),
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: employeeService.recordAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success('Attendance recorded');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to record attendance'),
  });

  const generateSalaryMutation = useMutation({
    mutationFn: ({ employeeId, month, year }: { employeeId: number; month: number; year: number }) =>
      employeeService.autoGenerateSalary(employeeId, month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast.success('Salary generated successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to generate salary'),
  });

  const processPaymentMutation = useMutation({
    mutationFn: employeeService.processPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast.success('Salary marked as paid');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to process payment'),
  });

  const activeEmployees = employees?.filter((e) => e.status === 'active') || [];
  const presentToday = useMemo(
    () => (attendanceRecords || []).filter((record) => record.date === new Date().toISOString().slice(0, 10) && record.status === 'present').length,
    [attendanceRecords]
  );
  const monthlyPayroll = useMemo(
    () => (salaries || []).reduce((sum, salary) => sum + salary.net_salary, 0),
    [salaries]
  );

  const handleAddEmployee = () => {
    if (!employeeForm.employee_code || !employeeForm.first_name || !employeeForm.last_name || !employeeForm.role) {
      toast.error('Employee code, first name, last name, and role are required');
      return;
    }

    addEmployeeMutation.mutate({
      employee_code: employeeForm.employee_code.trim(),
      first_name: employeeForm.first_name.trim(),
      last_name: employeeForm.last_name.trim(),
      role: employeeForm.role,
      department: employeeForm.department || undefined,
      base_salary: Number(employeeForm.base_salary || '0'),
      hourly_rate: Number(employeeForm.hourly_rate || '0'),
      email: employeeForm.email || undefined,
      phone: employeeForm.phone || undefined,
    });
  };

  const handleRecordAttendance = () => {
    if (!attendanceForm.employee_id) {
      toast.error('Select an employee');
      return;
    }

    recordAttendanceMutation.mutate({
      employee_id: Number(attendanceForm.employee_id),
      date: attendanceForm.date,
      status: attendanceForm.status,
      hours_worked: Number(attendanceForm.hours_worked || '0'),
      overtime_hours: Number(attendanceForm.overtime_hours || '0'),
    });
  };

  const handleGenerateSalary = () => {
    if (!salaryForm.employee_id) {
      toast.error('Select an employee');
      return;
    }

    generateSalaryMutation.mutate({
      employeeId: Number(salaryForm.employee_id),
      month: Number(salaryForm.month),
      year: Number(salaryForm.year),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff and payroll</p>
        </div>
        <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Employee Code" value={employeeForm.employee_code} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, employee_code: e.target.value }))} />
              <select className="h-10 rounded-md border bg-background px-3" value={employeeForm.role} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, role: e.target.value }))}>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Input placeholder="First Name" value={employeeForm.first_name} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, first_name: e.target.value }))} />
              <Input placeholder="Last Name" value={employeeForm.last_name} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, last_name: e.target.value }))} />
              <Input placeholder="Department" value={employeeForm.department} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, department: e.target.value }))} />
              <Input placeholder="Email" value={employeeForm.email} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))} />
              <Input placeholder="Phone" value={employeeForm.phone} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <Input type="number" placeholder="Base Salary" value={employeeForm.base_salary} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, base_salary: e.target.value }))} />
              <Input type="number" placeholder="Hourly Rate" value={employeeForm.hourly_rate} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, hourly_rate: e.target.value }))} />
              <div className="md:col-span-2">
                <Button className="w-full" onClick={handleAddEmployee} disabled={addEmployeeMutation.isPending}>
                  {addEmployeeMutation.isPending ? 'Adding...' : 'Save Employee'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{employees?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeEmployees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold">{presentToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Payroll</p>
              <p className="text-2xl font-bold">{monthlyPayroll.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : employees?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees?.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-medium">
                                {employee.first_name[0]}{employee.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{employee.full_name}</p>
                              <p className="text-xs text-muted-foreground">{employee.employee_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{employee.role}</TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.base_salary.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.attendance_rate.toFixed(0)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                <select className="h-10 rounded-md border bg-background px-3" value={attendanceForm.employee_id} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, employee_id: e.target.value }))}>
                  <option value="">Select employee</option>
                  {employees?.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                  ))}
                </select>
                <Input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, date: e.target.value }))} />
                <select className="h-10 rounded-md border bg-background px-3" value={attendanceForm.status} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, status: e.target.value as 'present' | 'absent' | 'late' | 'half_day' | 'leave' }))}>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">Leave</option>
                  <option value="absent">Absent</option>
                </select>
                <Input type="number" placeholder="Hours" value={attendanceForm.hours_worked} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, hours_worked: e.target.value }))} />
                <Button onClick={handleRecordAttendance} disabled={recordAttendanceMutation.isPending}>
                  {recordAttendanceMutation.isPending ? 'Saving...' : 'Record'}
                </Button>
              </div>

              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">Loading...</TableCell>
                    </TableRow>
                  ) : !attendanceRecords?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No attendance records yet</TableCell>
                    </TableRow>
                  ) : (
                    attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.employee_name}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell className="capitalize">{record.status.replace('_', ' ')}</TableCell>
                        <TableCell>{record.hours_worked}</TableCell>
                        <TableCell>{record.overtime_hours}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <select className="h-10 rounded-md border bg-background px-3" value={salaryForm.employee_id} onChange={(e) => setSalaryForm((prev) => ({ ...prev, employee_id: e.target.value }))}>
                  <option value="">Select employee</option>
                  {employees?.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                  ))}
                </select>
                <Input type="number" min="1" max="12" placeholder="Month" value={salaryForm.month} onChange={(e) => setSalaryForm((prev) => ({ ...prev, month: e.target.value }))} />
                <Input type="number" min="2000" placeholder="Year" value={salaryForm.year} onChange={(e) => setSalaryForm((prev) => ({ ...prev, year: e.target.value }))} />
                <Button onClick={handleGenerateSalary} disabled={generateSalaryMutation.isPending}>
                  {generateSalaryMutation.isPending ? 'Generating...' : 'Generate'}
                </Button>
              </div>

              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">Loading...</TableCell>
                    </TableRow>
                  ) : !salaries?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No salary records yet</TableCell>
                    </TableRow>
                  ) : (
                    salaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{salary.employee_name}</TableCell>
                        <TableCell>{salary.month}/{salary.year}</TableCell>
                        <TableCell>{salary.net_salary.toFixed(2)}</TableCell>
                        <TableCell>
                          {salary.is_paid ? (
                            <Badge className="gap-1"><CheckCircle className="h-3 w-3" /> Paid</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!salary.is_paid && (
                            <Button size="sm" onClick={() => processPaymentMutation.mutate(salary.id)} disabled={processPaymentMutation.isPending}>
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
