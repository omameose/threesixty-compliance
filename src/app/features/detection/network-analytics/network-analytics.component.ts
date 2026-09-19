import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { GraphEdge, GraphNode, NetworkGraphData } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  relation?: string;
}

const WIDTH = 640;
const HEIGHT = 480;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = 175;

@Component({
  selector: 'app-network-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent],
  templateUrl: './network-analytics.component.html'
})
export class NetworkAnalyticsComponent {
  graph: NetworkGraphData = { nodes: [], edges: [] };
  loading = true;
  query = '';

  focusId = signal<string>('');
  history = signal<string[]>([]);
  width = WIDTH;
  height = HEIGHT;
  centerX = CENTER_X;
  centerY = CENTER_Y;

  constructor(private data: DataService) {
    this.data.getNetworkGraph().subscribe(g => {
      this.graph = g;
      this.focusId.set(g.nodes[0]?.id || '');
      this.loading = false;
    });
  }

  node(id: string): GraphNode | undefined {
    return this.graph.nodes.find(n => n.id === id);
  }

  focusNode(): GraphNode | undefined {
    return this.node(this.focusId());
  }

  connectedEdges(id: string): GraphEdge[] {
    return this.graph.edges.filter(e => e.source === id || e.target === id);
  }

  neighbors(): PositionedNode[] {
    const id = this.focusId();
    const edges = this.connectedEdges(id);
    const count = edges.length || 1;
    return edges.map((e, i) => {
      const otherId = e.source === id ? e.target : e.source;
      const other = this.node(otherId);
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return {
        ...(other as GraphNode),
        x: CENTER_X + RADIUS * Math.cos(angle),
        y: CENTER_Y + RADIUS * Math.sin(angle),
        relation: e.relation
      };
    }).filter(n => !!n.id);
  }

  typeColor(type: GraphNode['type']) {
    return { customer: '#3b82f6', account: '#0ea5e9', device: '#8b5cf6', merchant: '#f59e0b', business: '#128a4d' }[type];
  }

  riskRingColor(risk: GraphNode['risk']) {
    return risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#1fae62';
  }

  focusOn(id: string) {
    if (id === this.focusId()) return;
    this.history.update(h => [...h, this.focusId()]);
    this.focusId.set(id);
  }

  goBack() {
    this.history.update(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      this.focusId.set(prev);
      return h.slice(0, -1);
    });
  }

  searchResults() {
    const q = this.query.trim().toLowerCase();
    if (!q) return [];
    return this.graph.nodes.filter(n => n.label.toLowerCase().includes(q)).slice(0, 6);
  }

  jumpTo(id: string) {
    this.focusOn(id);
    this.query = '';
  }

  highRiskClusterCount() {
    return this.graph.nodes.filter(n => n.risk === 'high').length;
  }

  sharedDeviceCount() {
    return this.graph.nodes.filter(n => n.type === 'device' && this.connectedEdges(n.id).length > 1).length;
  }
}
