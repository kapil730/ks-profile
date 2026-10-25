import { Request, Response } from 'express';
import { Project, IProject } from '../models/Project.js';
import { getIsConnected } from '../config/db.js';
import { initialProjects, IProjectData } from '../data/initialProjects.js';

// In-memory store fallback when MongoDB is not connected
let memoryProjects: IProjectData[] = initialProjects.map((p, idx) => ({
  ...p,
  _id: `mem-${idx + 1}`,
}));

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, featured } = req.query;

    if (getIsConnected()) {
      const query: any = { isPublished: true };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (featured === 'true') {
        query.featured = true;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { technologies: { $in: [new RegExp(String(search), 'i')] } },
        ];
      }

      const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });
      res.json({
        success: true,
        count: projects.length,
        data: projects,
      });
      return;
    }

    // Fallback in-memory
    let filtered = memoryProjects.filter((p) => p.isPublished);

    if (category && category !== 'All') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (featured === 'true') {
      filtered = filtered.filter((p) => p.featured);
    }

    if (search) {
      const term = String(search).toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.technologies.some((t) => t.toLowerCase().includes(term))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message,
    });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };
      const project = await Project.findOne(query);

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.json({
        success: true,
        data: project,
      });
      return;
    }

    const project = memoryProjects.find((p) => p._id === id || p.slug === id);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message,
    });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      detailedDescription,
      longDescription,
      category,
      image,
      imageUrl,
      technologies,
      keyFeatures,
      githubUrl,
      liveDemoUrl,
      liveUrl,
      featured,
      isPublished,
      published,
      isPlaceholder,
      order,
    } = req.body;

    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
      return;
    }

    const slug = req.body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const finalImage = image || imageUrl || '';
    const finalDesc = detailedDescription || longDescription || '';
    const finalLiveUrl = liveDemoUrl || liveUrl || '';
    const finalPublished = isPublished ?? published ?? true;

    if (getIsConnected()) {
      const existing = await Project.findOne({ slug });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const newProject = await Project.create({
        title,
        slug: finalSlug,
        description,
        detailedDescription: finalDesc,
        longDescription: finalDesc,
        category: category || 'Full Stack',
        image: finalImage,
        imageUrl: finalImage,
        technologies: Array.isArray(technologies) ? technologies : [],
        keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : [],
        githubUrl: githubUrl || '',
        liveDemoUrl: finalLiveUrl,
        liveUrl: finalLiveUrl,
        featured: featured ?? true,
        isPublished: finalPublished,
        published: finalPublished,
        isPlaceholder: isPlaceholder ?? false,
        order: order ?? 0,
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: newProject,
      });
      return;
    }

    const fallbackProject: IProjectData = {
      _id: `mem-${Date.now()}`,
      title,
      slug,
      description,
      detailedDescription: finalDesc,
      category: category || 'Full Stack',
      image: finalImage,
      technologies: Array.isArray(technologies) ? technologies : [],
      keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : [],
      githubUrl: githubUrl || '',
      liveDemoUrl: finalLiveUrl,
      featured: featured ?? true,
      isPublished: finalPublished,
      isPlaceholder: isPlaceholder ?? false,
      order: order ?? 0,
    };

    memoryProjects.unshift(fallbackProject);

    res.status(201).json({
      success: true,
      message: 'Project created (in-memory mode)',
      data: fallbackProject,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message,
    });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };
      const updated = await Project.findOneAndUpdate(query, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updated,
      });
      return;
    }

    const index = memoryProjects.findIndex((p) => p._id === id || p.slug === id);
    if (index === -1) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    memoryProjects[index] = { ...memoryProjects[index], ...req.body };

    res.json({
      success: true,
      message: 'Project updated (in-memory mode)',
      data: memoryProjects[index],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message,
    });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const query = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };
      const deleted = await Project.findOneAndDelete(query);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
      return;
    }

    const index = memoryProjects.findIndex((p) => p._id === id || p.slug === id);
    if (index === -1) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    memoryProjects.splice(index, 1);

    res.json({
      success: true,
      message: 'Project deleted (in-memory mode)',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message,
    });
  }
};
