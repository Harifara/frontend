import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rhApi, stockApi, authApi, API_BASE_URL, getHeaders, getKongToken } from "@/lib/api";
import { Users, DollarSign, FileText, Calendar, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

// Dashboard types
interface Stats {
  totalEmployees: number;
  employeesActive: number;
  employeesOnLeave: number;
  totalStockItems: number;
  lowStockCount: number;
  stockValue: number;
  expensesThisMonth: number;
  expensesPending: number;
  recentActivities: Array<any>;
  alerts: Array<any>;
  expenseSeries: Array<{ month: string; value: number }>;
  stockSeries: Array<{ label: string; value: number }>;
}

const defaultStats: Stats = {
  totalEmployees: 0,
  employeesActive: 0,
  employeesOnLeave: 0,
  totalStockItems: 0,
  lowStockCount: 0,
  stockValue: 0,
  expensesThisMonth: 0,
  expensesPending: 0,
  recentActivities: [],
  alerts: [],
  expenseSeries: [],
  stockSeries: [],
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      // get current user
      const me = await authApi.getMe();
      setUser(me);

      // Parallel fetches (try real endpoints, fallback to computed/mock)
      const [employees, stocks] = await Promise.allSettled([rhApi.getEmployes(), stockApi.getStocks()]);

      // employees
      let totalEmployees = 0;
      let employeesOnLeave = 0;
      let employeesActive = 0;
      let recentActivities: any[] = [];

      if (employees.status === 'fulfilled' && Array.isArray(employees.value)) {
        totalEmployees = employees.value.length;
        // heuristics for statuses
        employeesActive = employees.value.filter((e: any) => e.status_employer === 'actif').length;
        employeesOnLeave = employees.value.filter((e: any) => e.status_employer === 'conge').length;
        recentActivities = employees.value.slice(-5).map((e: any) => ({ type: 'employee', description: `Profil mis à jour: ${e.nom_employer} ${e.prenom_employer}`, date: e.updated_at || e.date_entree }));
      }

      // stocks
      let totalStockItems = 0;
      let lowStockCount = 0;
      let stockValue = 0;
      let stockSeries: any[] = [];

      if (stocks.status === 'fulfilled' && Array.isArray(stocks.value)) {
        // assume stocks.value is list of stock rows with quantite and prix_unitaire (best-effort)
        totalStockItems = stocks.value.reduce((s: number, it: any) => s + (Number(it.quantite) || 0), 0);
        lowStockCount = stocks.value.filter((it: any) => (it.seuil_alert || 0) > 0 && Number(it.quantite) <= Number(it.seuil_alert)).length;
        stockValue = stocks.value.reduce((s: number, it: any) => s + ((Number(it.quantite) || 0) * (Number(it.prix_unitaire) || 0)), 0);
        // build a category series if present
        const byCat: Record<string, number> = {};
        stocks.value.forEach((it: any) => {
          const cat = it.categorie?.nom || it.article?.categorie?.nom || 'Autres';
          byCat[cat] = (byCat[cat] || 0) + (Number(it.quantite) || 0);
        });
        stockSeries = Object.keys(byCat).slice(0, 8).map(k => ({ label: k, value: byCat[k] }));
      }

      // finance: try to fetch summary endpoint; if missing fallback to mock
      let expensesThisMonth = 0;
      let expensesPending = 0;
      let expenseSeries: any[] = [];
      try {
        const token = await getKongToken();
        const res = await fetch(`${API_BASE_URL}/finance/summary/`, { headers: getHeaders(token) });
        if (res.ok) {
          const data = await res.json();
          expensesThisMonth = Number(data.this_month || data.month_total || 0);
          expensesPending = Number(data.pending || 0);
          expenseSeries = Array.isArray(data.series) ? data.series : (data.months || []);
        } else {
          // fallback: try expenses list
          const r2 = await fetch(`${API_BASE_URL}/finance/expenses/`, { headers: getHeaders(token) });
          if (r2.ok) {
            const arr = await r2.json();
            // compute month total
            const now = new Date();
            expensesThisMonth = arr.filter((it: any) => new Date(it.created_at).getMonth() === now.getMonth()).reduce((s: number, it: any) => s + (Number(it.montant) || 0), 0);
            expensesPending = arr.filter((it: any) => it.status === 'pending').length;
            // small series: last 6 months
            const monthsMap: Record<string, number> = {};
            for (let i = 5; i >= 0; i--) {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              monthsMap[d.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })] = 0;
            }
            arr.forEach((it: any) => {
              const lab = new Date(it.created_at).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
              if (monthsMap[lab] !== undefined) monthsMap[lab] += Number(it.montant) || 0;
            });
            expenseSeries = Object.keys(monthsMap).map(k => ({ month: k, value: monthsMap[k] }));
          }
        }
      } catch (err) {
        // ignore and fallback to zero
        console.warn('finance summary fetch failed', err);
      }

      // alerts: combine stock low + expenses pending
      const alerts: any[] = [];
      if (lowStockCount > 0) alerts.push({ id: 'stock-low', type: 'warning', title: `${lowStockCount} article(s) en dessous du seuil`, message: 'Vérifier les niveaux de stock.' });
      if (expensesPending > 0) alerts.push({ id: 'exp-pend', type: 'info', title: `${expensesPending} dépense(s) en attente`, message: 'Valider les dépenses en attente.' });

      const newStats: Stats = {
        totalEmployees,
        employeesActive,
        employeesOnLeave,
        totalStockItems,
        lowStockCount,
        stockValue,
        expensesThisMonth,
        expensesPending,
        recentActivities,
        alerts,
        expenseSeries: expenseSeries.length ? expenseSeries : [{ month: 'Jan', value: 0 }, { month: 'Feb', value: 0 }],
        stockSeries,
      };

      setStats(newStats);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role || 'employe';

  const formatNumber = (v: number) => v.toLocaleString('fr-FR');

  if (loading) return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[0,1,2,3].map(i => (
          <Card key={i} className="animate-pulse"><CardContent className="h-28" /></Card>
        ))}
      </div>
    </div>
  );

  // Card component short helper
  const StatCard: React.FC<{title:string, value:string|number, icon?:React.ReactNode, note?:string}> = ({title, value, icon, note}) => (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
        </div>
        <div className="text-primary">{icon}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <Badge variant="secondary">{role === 'admin' ? 'Administrateur' : role}</Badge>
      </div>

      {/* Top cards - vary by role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Employees */}
        {(role === 'admin' || role === 'responsable_rh' || role === 'coordinateur') && (
          <StatCard title="Total employés" value={formatNumber(stats.totalEmployees)} icon={<Users className="w-8 h-8" />} />
        )}

        {/* Stock */}
        {(role === 'admin' || role === 'responsable_stock' || role === 'magasinier') && (
          <StatCard title="Stock total (unités)" value={formatNumber(stats.totalStockItems)} icon={<FileText className="w-8 h-8" />} note={`Valeur estimée: ${formatNumber(stats.stockValue)} Ar`} />
        )}

        {/* Expenses */}
        {(role === 'admin' || role === 'responsable_finance') && (
          <StatCard title="Dépenses ce mois" value={`${formatNumber(stats.expensesThisMonth)} Ar`} icon={<DollarSign className="w-8 h-8" />} note={`${formatNumber(stats.expensesPending)} en attente`} />
        )}

        {/* Alerts quick */}
        <StatCard title="Alertes" value={stats.alerts.length} icon={<AlertTriangle className="w-8 h-8" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats.expenseSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={stats.expenseSeries[0].month ? 'month' : 'label'} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Niveaux de stock (par catégorie)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.stockSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: activities + alerts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activités récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivities.length ? stats.recentActivities.slice().reverse().map((a, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><CheckCircle className="w-4 h-4" /></div>
                    <div>
                      <div className="text-sm font-medium">{a.description}</div>
                      <div className="text-xs text-muted-foreground">{a.date ? new Date(a.date).toLocaleString('fr-FR') : ''}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground">Aucune activité récente.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.alerts.length ? stats.alerts.map(a => (
                  <div key={a.id} className="p-3 rounded bg-muted/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.message}</div>
                      </div>
                      <div className="text-muted-foreground text-xs">{a.type}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground">Aucune alerte.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role-specific quick lists */}
      {(role === 'admin' || role === 'responsable_rh') && (
        <Card>
          <CardHeader>
            <CardTitle>Ressources humaines — éléments rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded">Actifs: {stats.employeesActive}</div>
              <div className="p-4 bg-muted rounded">En congé: {stats.employeesOnLeave}</div>
              <div className="p-4 bg-muted rounded">Total: {stats.totalEmployees}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {(role === 'admin' || role === 'responsable_stock' || role === 'magasinier') && (
        <Card>
          <CardHeader>
            <CardTitle>Stock — éléments rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded">Total unités: {stats.totalStockItems}</div>
              <div className="p-4 bg-muted rounded">Faible stock: {stats.lowStockCount}</div>
              <div className="p-4 bg-muted rounded">Valeur: {formatNumber(stats.stockValue)} Ar</div>
            </div>
          </CardContent>
        </Card>
      )}

      {(role === 'admin' || role === 'responsable_finance') && (
        <Card>
          <CardHeader>
            <CardTitle>Finances — éléments rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded">Dépenses mois: {formatNumber(stats.expensesThisMonth)} Ar</div>
              <div className="p-4 bg-muted rounded">En attente: {stats.expensesPending}</div>
              <div className="p-4 bg-muted rounded">Budget utilisé: —</div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
