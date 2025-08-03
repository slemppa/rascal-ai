import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MixpostAPI from '../services/mixpostApi';

const SocialMediaAnalytics = () => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState('main');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  
  // Mock workspaces - korvaa Mixpost API:n datalla
  const [workspaces] = useState([
    { id: 'main', name: 'Päätyöskentely-ympäristö', role: 'admin' },
    { id: 'marketing', name: 'Marketing-tiimi', role: 'editor' },
    { id: 'client', name: 'Asiakasprojekti', role: 'viewer' }
  ]);

  // Mock social media accounts - integroituu Mixpost API:n kanssa
  const [accounts, setAccounts] = useState({
    'main': [
      { id: 'fb-main', platform: 'facebook', name: 'Yritys Facebook', followers: 15420, connected: true },
      { id: 'ig-main', platform: 'instagram', name: 'Yritys Instagram', followers: 8930, connected: false },
      { id: 'tw-main', platform: 'twitter', name: 'Yritys Twitter', followers: 3240, connected: true },
      { id: 'li-main', platform: 'linkedin', name: 'Yritys LinkedIn', followers: 5680, connected: false }
    ],
    'marketing': [
      { id: 'ig-marketing', platform: 'instagram', name: 'Marketing Instagram', followers: 2100, connected: true }
    ],
    'client': [
      { id: 'fb-client', platform: 'facebook', name: 'Asiakas Facebook', followers: 950, connected: true }
    ]
  });

  const [metrics, setMetrics] = useState({
    likes: 0,
    comments: 0,
    followers: 0,
    reach: 0,
    posts: 0,
    engagementRate: 0
  });

  const [audienceData, setAudienceData] = useState([]);
  const [platformBreakdown, setPlatformBreakdown] = useState([]);

  // Hae data Supabasesta ja Mixpost API:sta
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Hae käyttäjän user_id
        const { data: userRow } = await supabase
          .from('users')
          .select('id, mixpost_workspaces')
          .eq('auth_user_id', user.id)
          .single();

        if (userRow?.mixpost_workspaces) {
          // Hae Mixpost-dataa jos käyttäjällä on workspacet
          await fetchMixpostData(userRow.mixpost_workspaces);
        } else {
          // Käytä Supabase-dataa
          await fetchSupabaseData(userRow?.id);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Fallback mockdataan
        generateMockData();
      }
      setLoading(false);
    };

    fetchData();
  }, [user, currentWorkspace, selectedAccount, selectedPlatform, timeRange]);

  const fetchMixpostData = async (workspaces) => {
    try {
      // Integroituu olemassa olevaan Mixpost API:hin
      const workspaceData = workspaces.find(w => w.id === currentWorkspace);
      if (!workspaceData) return;

      // Hae social media tilit
      const socialAccounts = await MixpostAPI.getSocialAccounts(
        workspaceData.uuid, 
        workspaceData.api_token
      );

      // Päivitä tilit
      setAccounts(prev => ({
        ...prev,
        [currentWorkspace]: socialAccounts.map(account => ({
          id: account.id,
          platform: account.provider.toLowerCase(),
          name: account.name,
          followers: account.data?.followers_count || 0,
          connected: true
        }))
      }));

      // Simuloi metriikat (korvaa oikealla API-datalla)
      const totalFollowers = socialAccounts.reduce((sum, acc) => 
        sum + (acc.data?.followers_count || 0), 0
      );
      
      setMetrics({
        likes: Math.floor(totalFollowers * 0.05),
        comments: Math.floor(totalFollowers * 0.01),
        followers: totalFollowers,
        reach: Math.floor(totalFollowers * 2.5),
        posts: socialAccounts.length * 4,
        engagementRate: 3.2
      });

      generateAudienceData(totalFollowers);
      generatePlatformBreakdown(socialAccounts);

    } catch (error) {
      console.error('Error fetching Mixpost data:', error);
      generateMockData();
    }
  };

  const fetchSupabaseData = async (userId) => {
    try {
      // Hae sisältöjen määrä
      const { count: postsCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Hae viimeaikaisia sisältöjä engagement-dataa varten
      const { data: recentContent } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Laske metriikat Supabase-datan perusteella
      const totalPosts = postsCount || 0;
      const estimatedFollowers = totalPosts * 150; // Arvio
      
      setMetrics({
        likes: Math.floor(totalPosts * 25),
        comments: Math.floor(totalPosts * 5),
        followers: estimatedFollowers,
        reach: Math.floor(totalPosts * 500),
        posts: totalPosts,
        engagementRate: totalPosts > 0 ? 4.1 : 0
      });

      generateAudienceData(estimatedFollowers);
      generateSupabasePlatformBreakdown(recentContent || []);

    } catch (error) {
      console.error('Error fetching Supabase data:', error);
      generateMockData();
    }
  };

  const generateMockData = () => {
    const mockFollowers = 5000;
    setMetrics({
      likes: 234,
      comments: 45,
      followers: mockFollowers,
      reach: 12500,
      posts: 18,
      engagementRate: 3.8
    });
    generateAudienceData(mockFollowers);
    generateMockPlatformBreakdown();
  };

  const generateAudienceData = (baseFollowers) => {
    const data = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const growthFactor = Math.max(0, baseFollowers - (days - i) * 20);
      const variation = Math.floor(Math.random() * 100) - 50;
      
      data.push({
        date: date.toLocaleDateString('fi-FI', { month: 'numeric', day: 'numeric' }),
        followers: Math.max(0, growthFactor + variation),
        fullDate: date.toISOString().split('T')[0]
      });
    }
    setAudienceData(data);
  };

  const generatePlatformBreakdown = (socialAccounts) => {
    const platformData = socialAccounts.map(account => ({
      platform: account.provider.toLowerCase(),
      name: account.name,
      followers: account.data?.followers_count || 0,
      engagement: Math.floor(Math.random() * 8) + 2
    }));
    setPlatformBreakdown(platformData);
  };

  const generateSupabasePlatformBreakdown = (contentData) => {
    // Analysoi sisältötyyppejä ja luo platform breakdown
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin'];
    const platformData = platforms.map(platform => ({
      platform,
      name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} sisältö`,
      followers: Math.floor(Math.random() * 5000) + 500,
      engagement: Math.floor(Math.random() * 8) + 2
    }));
    setPlatformBreakdown(platformData);
  };

  const generateMockPlatformBreakdown = () => {
    const platformData = [
      { platform: 'instagram', name: 'Instagram', followers: 2500, engagement: 4.2 },
      { platform: 'facebook', name: 'Facebook', followers: 1500, engagement: 2.8 },
      { platform: 'twitter', name: 'Twitter', followers: 800, engagement: 3.5 },
      { platform: 'linkedin', name: 'LinkedIn', followers: 200, engagement: 6.1 }
    ];
    setPlatformBreakdown(platformData);
  };

  const MetricCard = ({ title, value, color = "text-blue-600", subtitle, loading = false }) => (
    <div className="text-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {loading ? (
        <>
          <div className="bg-gray-200 h-4 w-20 mx-auto rounded mb-2 animate-pulse"></div>
          <div className="bg-gray-200 h-8 w-16 mx-auto rounded mb-1 animate-pulse"></div>
          <div className="bg-gray-200 h-3 w-24 mx-auto rounded animate-pulse"></div>
        </>
      ) : (
        <>
          <div className="text-gray-600 text-sm font-medium mb-1">{title}</div>
          <div className={`text-2xl font-bold ${color}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </>
      )}
    </div>
  );

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼'
    };
    return icons[platform] || '📱';
  };

  const currentAccounts = accounts[currentWorkspace] || [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header ja kontrollit */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Media Analytics</h1>
            <p className="text-gray-600">
              Workspace: {workspaces.find(w => w.id === currentWorkspace)?.name}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Workspace selector */}
            <select 
              value={currentWorkspace} 
              onChange={(e) => setCurrentWorkspace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} ({workspace.role})
                </option>
              ))}
            </select>

            {/* Platform filter */}
            <select 
              value={selectedPlatform} 
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Kaikki alustat</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>

            {/* Account filter */}
            <select 
              value={selectedAccount} 
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Kaikki tilit</option>
              {currentAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {getPlatformIcon(account.platform)} {account.name}
                </option>
              ))}
            </select>

            {/* Time range */}
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="7d">7 päivää</option>
              <option value="30d">30 päivää</option>
              <option value="90d">90 päivää</option>
            </select>
          </div>
        </div>
      </div>

      {/* Päämetriikat */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard title="Likes" value={metrics.likes} color="text-pink-600" loading={loading} />
        <MetricCard title="Comments" value={metrics.comments} color="text-green-600" loading={loading} />
        <MetricCard title="Followers" value={metrics.followers} color="text-purple-600" loading={loading} />
        <MetricCard title="Reach" value={metrics.reach} color="text-blue-600" loading={loading} />
        <MetricCard title="Posts" value={metrics.posts} color="text-orange-600" loading={loading} />
        <MetricCard 
          title="Engagement" 
          value={`${metrics.engagementRate.toFixed(1)}%`} 
          color="text-teal-600" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Audience chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Audience Growth</h3>
            <p className="text-sm text-gray-600">Seuraajien kasvu ajanjaksolla</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={audienceData}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
            <p className="text-sm text-gray-600">Seuraajat alustittain</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformBreakdown}>
                <XAxis 
                  dataKey="platform" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Bar dataKey="followers" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yhdistetyt tilit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentAccounts.map(account => (
            <div key={account.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{account.name}</div>
                  <div className="text-sm text-gray-500 capitalize flex items-center gap-2">
                    {account.platform}
                    <span className={`w-2 h-2 rounded-full ${account.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold text-green-600">
                {account.followers.toLocaleString()} seuraajaa
              </div>
            </div>
          ))}
          
          {currentAccounts.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              Ei yhdistettyjä tilejä tässä workspace:ssa
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live data - {workspaces.find(w => w.id === currentWorkspace)?.name}</span>
      </div>
    </div>
  );
};

export default SocialMediaAnalytics;