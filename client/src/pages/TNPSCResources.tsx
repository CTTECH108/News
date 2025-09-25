import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  GraduationCap, 
  Book, 
  FileText, 
  Download, 
  Search,
  Bookmark,
  Star,
  History,
  Globe,
  Users,
  Target,
  BookOpen
} from "lucide-react";

interface TNPSCResource {
  id: string;
  title: string;
  category: string;
  subject: string;
  examStage: string;
  fileUrl: string;
  description: string;
  createdAt: string;
}

interface Syllabus {
  prelims: Record<string, Record<string, string[]>>;
  mains: Record<string, string[]>;
}

export default function TNPSCResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/tnpsc/resources', selectedCategory, selectedStage],
    enabled: true,
  });

  const { data: syllabusData, isLoading: syllabusLoading } = useQuery({
    queryKey: ['/api/tnpsc/syllabus'],
    enabled: true,
  });

  const { data: bookmarksData } = useQuery({
    queryKey: ['/api/bookmarks'],
    enabled: !!user,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (data: { resourceType: string; resourceId: string; title: string }) => {
      const response = await apiRequest('POST', '/api/bookmarks', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: "Bookmarked",
        description: "Resource added to your bookmarks",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to bookmark resource",
        variant: "destructive",
      });
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (data: { resourceType: string; resourceId: string }) => {
      const response = await apiRequest('DELETE', '/api/bookmarks', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: "Removed",
        description: "Resource removed from bookmarks",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove bookmark",
        variant: "destructive",
      });
    },
  });

  const resources = (resourcesData as any)?.resources || [];
  const syllabus = syllabusData as Syllabus || { prelims: {}, mains: {} };
  const bookmarks = (bookmarksData as any)?.bookmarks || [];

  const filteredResources = resources.filter((resource: TNPSCResource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesStage = selectedStage === "all" || resource.examStage === selectedStage;
    
    return matchesSearch && matchesCategory && matchesStage;
  });

  const isBookmarked = (resourceId: string) => {
    return bookmarks.some((bookmark: any) => 
      bookmark.resourceType === 'tnpsc_material' && bookmark.resourceId === resourceId
    );
  };

  const handleBookmark = (resource: TNPSCResource) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to bookmark resources",
        variant: "destructive",
      });
      return;
    }

    if (isBookmarked(resource.id)) {
      removeBookmarkMutation.mutate({
        resourceType: 'tnpsc_material',
        resourceId: resource.id,
      });
    } else {
      bookmarkMutation.mutate({
        resourceType: 'tnpsc_material',
        resourceId: resource.id,
        title: resource.title,
      });
    }
  };

  const handleDownload = (resource: TNPSCResource) => {
    // In a real implementation, this would trigger actual file download
    toast({
      title: "Download started",
      description: `Downloading ${resource.title}`,
    });
    
    // Simulate download
    const link = document.createElement('a');
    link.href = resource.fileUrl;
    link.download = resource.title + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    { id: 'all', name: 'All Resources' },
    { id: 'book', name: 'Books' },
    { id: 'notes', name: 'Notes' },
    { id: 'syllabus', name: 'Syllabus' },
  ];

  const examStages = [
    { id: 'all', name: 'All Stages' },
    { id: 'prelims', name: 'Prelims' },
    { id: 'mains', name: 'Mains' },
  ];

  const stats = [
    { label: "Study Materials", value: resources.length.toString(), icon: Book },
    { label: "Subjects Covered", value: "12+", icon: BookOpen },
    { label: "Success Rate", value: "85%", icon: Target },
    { label: "Active Learners", value: "10K+", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background py-8" data-testid="tnpsc-resources-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <GraduationCap className="mr-2 text-primary" />
              TNPSC Preparation Hub
            </h1>
            <p className="text-xl text-muted-foreground">
              Complete study materials, syllabus, and resources for TNPSC exam success
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Icon size={24} className="mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Tabs defaultValue="resources" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resources" data-testid="tab-resources">
                <Book className="mr-2" size={16} />
                Study Materials
              </TabsTrigger>
              <TabsTrigger value="syllabus" data-testid="tab-syllabus">
                <FileText className="mr-2" size={16} />
                Syllabus
              </TabsTrigger>
              <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">
                <Bookmark className="mr-2" size={16} />
                My Bookmarks
              </TabsTrigger>
            </TabsList>

            {/* Study Materials Tab */}
            <TabsContent value="resources" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Find Study Materials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="Search by title, subject, or keyword..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          data-testid="search-input"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-input rounded-md bg-background"
                        data-testid="category-filter"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="px-3 py-2 border border-input rounded-md bg-background"
                        data-testid="stage-filter"
                      >
                        {examStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resources Grid */}
              {resourcesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-6 bg-muted rounded mb-4"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="resources-grid">
                  {filteredResources.map((resource: TNPSCResource) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="outline" className="text-xs">
                              {resource.category.toUpperCase()}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBookmark(resource)}
                              className={isBookmarked(resource.id) ? "text-yellow-500" : "text-muted-foreground"}
                              data-testid={`bookmark-button-${resource.id}`}
                            >
                              <Star size={16} className={isBookmarked(resource.id) ? "fill-current" : ""} />
                            </Button>
                          </div>
                          
                          <h3 className="font-bold text-lg mb-2 line-clamp-2" data-testid={`resource-title-${resource.id}`}>
                            {resource.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {resource.subject}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {resource.examStage}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {resource.description}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(resource)}
                              className="flex-1"
                              data-testid={`download-button-${resource.id}`}
                            >
                              <Download size={16} className="mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {filteredResources.length === 0 && !resourcesLoading && (
                <div className="text-center py-12">
                  <Book size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No resources found matching your criteria.</p>
                </div>
              )}
            </TabsContent>

            {/* Syllabus Tab */}
            <TabsContent value="syllabus" className="space-y-6">
              {syllabusLoading ? (
                <div className="space-y-6">
                  <Card className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded mb-4"></div>
                      <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-4 bg-muted rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Prelims Syllabus */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2" size={20} />
                        Prelims Syllabus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-testid="prelims-syllabus">
                      {Object.entries(syllabus.prelims).map(([subject, topics]) => (
                        <div key={subject} className="space-y-2">
                          <h4 className="font-semibold text-primary">{subject}</h4>
                          {Object.entries(topics).map(([topic, subtopics]) => (
                            <div key={topic} className="ml-4 space-y-1">
                              <h5 className="font-medium text-sm">{topic}</h5>
                              <ul className="ml-4 space-y-1">
                                {subtopics.map((subtopic, index) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    • {subtopic}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Mains Syllabus */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="mr-2" size={20} />
                        Mains Syllabus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4" data-testid="mains-syllabus">
                      {Object.entries(syllabus.mains).map(([paper, topics]) => (
                        <div key={paper} className="space-y-2">
                          <h4 className="font-semibold text-primary">{paper}</h4>
                          <ul className="ml-4 space-y-1">
                            {topics.map((topic, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                • {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="space-y-6">
              {!user ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bookmark size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please login to view your bookmarked resources
                    </p>
                    <Button asChild>
                      <a href="/login">Login Now</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : bookmarks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bookmark size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Bookmarks Yet</h3>
                    <p className="text-muted-foreground">
                      Start bookmarking resources to build your personal study library
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4" data-testid="bookmarks-list">
                  {bookmarks.map((bookmark: any) => (
                    <Card key={bookmark.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Star className="text-yellow-500 fill-current" size={20} />
                            <div>
                              <h4 className="font-medium">{bookmark.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Bookmarked on {new Date(bookmark.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBookmarkMutation.mutate({
                              resourceType: bookmark.resourceType,
                              resourceId: bookmark.resourceId,
                            })}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
