import { useState, useMemo, useRef, useCallback } from 'react';
import type { FamilyMember } from '../types';

interface Props {
  members: FamilyMember[];
  onMemberClick: (member: FamilyMember) => void;
}

const NODE_W = 130;
const NODE_H = 72;
const GEN_GAP = 140;
const NODE_GAP = 40;
const SPOUSE_GAP = 16;

interface LayoutNode {
  member: FamilyMember;
  x: number;
  y: number;
  spouse?: FamilyMember;
  spouseX?: number;
}

export default function FamilyTreeView({ members, onMemberClick }: Props) {
  const [scale, setScale] = useState(1);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, connections, svgW, svgH } = useMemo(() => {
    if (members.length === 0) return { nodes: [], connections: [], svgW: 400, svgH: 200 };

    // Group by generation
    const genMap = new Map<number, FamilyMember[]>();
    members.forEach((m) => {
      const arr = genMap.get(m.generation) || [];
      arr.push(m);
      genMap.set(m.generation, arr);
    });

    const gens = Array.from(genMap.keys()).sort((a, b) => a - b);

    // Build children map
    const childrenMap = new Map<number, FamilyMember[]>();
    members.forEach((m) => {
      if (m.father_id) {
        const arr = childrenMap.get(m.father_id) || [];
        arr.push(m);
        childrenMap.set(m.father_id, arr);
      }
      if (m.mother_id) {
        const arr = childrenMap.get(m.mother_id) || [];
        if (!arr.includes(m)) arr.push(m);
        childrenMap.set(m.mother_id, arr);
      }
    });

    // Check if member has spouse
    const spouseMap = new Map<number, FamilyMember>();
    members.forEach((m) => {
      if (m.spouse_id) {
        const spouse = members.find((s) => s.id === m.spouse_id);
        if (spouse) {
          spouseMap.set(m.id, spouse);
          spouseMap.set(spouse.id, m);
        }
      }
    });

    // Position nodes
    const layoutNodes: LayoutNode[] = [];
    // Track processed members to avoid duplicates (spouses)
    const processed = new Set<number>();

    gens.forEach((gen, genIdx) => {
      const genMembers = genMap.get(gen)!.filter((m) => !processed.has(m.id));
      const y = genIdx * GEN_GAP;

      // For members with a spouse in the same generation, pair them
      const paired = new Set<number>();
      const row: { member: FamilyMember; spouse?: FamilyMember }[] = [];

      genMembers.forEach((m) => {
        if (paired.has(m.id)) return;
        const spouse = spouseMap.get(m.id);
        if (spouse && spouse.generation === gen && !paired.has(spouse.id)) {
          row.push({ member: m, spouse });
          paired.add(m.id);
          paired.add(spouse.id);
        } else {
          row.push({ member: m });
          paired.add(m.id);
        }
      });

      // Calculate total width for this row
      const totalW = row.length * NODE_W + (row.length - 1) * NODE_GAP;
      let startX = Math.max(40, (800 - totalW) / 2);

      row.forEach((item) => {
        if (item.spouse) {
          // Main member on the left, spouse on the right
          layoutNodes.push({
            member: item.member,
            x: startX,
            y,
            spouse: item.spouse,
            spouseX: startX + NODE_W + SPOUSE_GAP,
          });
          processed.add(item.member.id);
          processed.add(item.spouse.id);
          startX += NODE_W * 2 + SPOUSE_GAP + NODE_GAP;
        } else {
          layoutNodes.push({ member: item.member, x: startX, y });
          processed.add(item.member.id);
          startX += NODE_W + NODE_GAP;
        }
      });
    });

    // Calculate connections (parent-child lines)
    const connections: { fromX: number; fromY: number; toX: number; toY: number }[] = [];

    layoutNodes.forEach((node) => {
      const children = childrenMap.get(node.member.id);
      if (!children || children.length === 0) return;

      const parentCX = node.x + NODE_W / 2;
      const parentBottom = node.y + NODE_H;

      // Get child positions from layoutNodes
      const childPositions = children.map((c) => {
        const childNode = layoutNodes.find((n) => n.member.id === c.id);
        return childNode ? { x: childNode.x + NODE_W / 2, y: childNode.y } : null;
      }).filter(Boolean) as { x: number; y: number }[];

      if (childPositions.length === 1) {
        connections.push({
          fromX: parentCX, fromY: parentBottom,
          toX: childPositions[0].x, toY: childPositions[0].y,
        });
      } else {
        // Multiple children: draw from parent to a horizontal bar, then down to each child
        const midY = parentBottom + (childPositions[0].y - parentBottom) / 2;
        const minX = Math.min(...childPositions.map((c) => c.x));
        const maxX = Math.max(...childPositions.map((c) => c.x));

        connections.push({ fromX: parentCX, fromY: parentBottom, toX: parentCX, toY: midY });
        connections.push({ fromX: minX, fromY: midY, toX: maxX, toY: midY });
        childPositions.forEach((cp) => {
          connections.push({ fromX: cp.x, fromY: midY, toX: cp.x, toY: cp.y });
        });
      }
    });

    const allX = layoutNodes.flatMap((n) => [n.x, n.spouseX ?? n.x]);
    const maxX = Math.max(...allX) + NODE_W + 60;
    const maxY = gens.length * GEN_GAP + 60;

    return { nodes: layoutNodes, connections, svgW: Math.max(800, maxX), svgH: Math.max(300, maxY) };
  }, [members]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.3, Math.min(2, s - e.deltaY * 0.001)));
  }, []);

  if (members.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-400">暂无成员数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <span className="text-xs text-gray-500">滚轮缩放 | 当前 {Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(1)}
          className="text-xs text-primary-600 hover:text-primary-700"
        >
          重置
        </button>
      </div>
      <div className="overflow-auto w-full h-full" onWheel={handleWheel}>
        <svg
          ref={svgRef}
          width={svgW * scale}
          height={svgH * scale}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="block"
        >
          <g transform={`scale(${scale})`}>
            {/* Connections */}
            {connections.map((c, i) => (
              <line
                key={`conn-${i}`}
                x1={c.fromX} y1={c.fromY} x2={c.toX} y2={c.toY}
                stroke="#cbd5e1" strokeWidth={2}
              />
            ))}

            {/* Spouse connections */}
            {nodes.filter((n) => n.spouse).map((n) => (
              <line
                key={`spouse-${n.member.id}`}
                x1={n.x + NODE_W} y1={n.y + NODE_H / 2}
                x2={n.spouseX} y2={n.y + NODE_H / 2}
                stroke="#e2e8f0" strokeWidth={2} strokeDasharray="4,3"
              />
            ))}

            {/* Nodes */}
            {nodes.map((node) => {
              const isHovered = hoveredId === node.member.id;
              const isMale = node.member.gender === 'male';
              const accentColor = isMale ? '#3b82f6' : '#ec4899';

              return (
                <g
                  key={node.member.id}
                  onClick={() => onMemberClick(node.member)}
                  onMouseEnter={() => setHoveredId(node.member.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={node.x} y={node.y}
                    width={NODE_W} height={NODE_H}
                    rx={8} ry={8}
                    fill={isHovered ? '#f8fafc' : '#fff'}
                    stroke={isHovered ? accentColor : '#e2e8f0'}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{ transition: 'all 0.15s' }}
                  />
                  {/* Accent line */}
                  <rect x={node.x} y={node.y} width={NODE_W} height={4} rx={2} fill={accentColor} />

                  {/* Avatar */}
                  {node.member.avatar_url ? (
                    <clipPath id={`clip-${node.member.id}`}>
                      <circle cx={node.x + 22} cy={node.y + 30} r={14} />
                    </clipPath>
                  ) : null}
                  {node.member.avatar_url ? (
                    <image
                      href={node.member.avatar_url}
                      x={node.x + 8} y={node.y + 16}
                      width={28} height={28}
                      clipPath={`url(#clip-${node.member.id})`}
                    />
                  ) : (
                    <circle cx={node.x + 22} cy={node.y + 30} r={14} fill={isMale ? '#bfdbfe' : '#fbcfe8'} />
                  )}
                  {!node.member.avatar_url && (
                    <text x={node.x + 22} y={node.y + 34} textAnchor="middle" fontSize={12} fill={accentColor} fontWeight={600}>
                      {node.member.name[0]}
                    </text>
                  )}

                  {/* Name & info */}
                  <text x={node.x + 44} y={node.y + 26} fontSize={14} fontWeight={600} fill="#1e293b">
                    {node.member.name}
                  </text>
                  <text x={node.x + 44} y={node.y + 44} fontSize={11} fill="#94a3b8">
                    {isMale ? '♂' : '♀'} 第{node.member.generation}世
                  </text>
                  {node.member.birth_year && (
                    <text x={node.x + 44} y={node.y + 60} fontSize={11} fill="#94a3b8">
                      {node.member.birth_year}{node.member.death_year ? ` - ${node.member.death_year}` : ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Spouse nodes (compact) */}
            {nodes.filter((n) => n.spouse).map((node) => {
              const spouse = node.spouse!;
              const isHovered = hoveredId === spouse.id;
              const isMale = spouse.gender === 'male';
              const accentColor = isMale ? '#3b82f6' : '#ec4899';

              return (
                <g
                  key={spouse.id}
                  onClick={() => onMemberClick(spouse)}
                  onMouseEnter={() => setHoveredId(spouse.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={node.spouseX} y={node.y}
                    width={NODE_W} height={NODE_H}
                    rx={8} ry={8}
                    fill={isHovered ? '#f8fafc' : '#fff'}
                    stroke={isHovered ? accentColor : '#e2e8f0'}
                    strokeWidth={isHovered ? 2 : 1}
                  />
                  <rect x={node.spouseX!} y={node.y} width={NODE_W} height={4} rx={2} fill={accentColor} />

                  {spouse.avatar_url ? (
                    <clipPath id={`clip-${spouse.id}`}>
                      <circle cx={node.spouseX! + 22} cy={node.y + 30} r={14} />
                    </clipPath>
                  ) : null}
                  {spouse.avatar_url ? (
                    <image
                      href={spouse.avatar_url}
                      x={node.spouseX! + 8} y={node.y + 16}
                      width={28} height={28}
                      clipPath={`url(#clip-${spouse.id})`}
                    />
                  ) : (
                    <circle cx={node.spouseX! + 22} cy={node.y + 30} r={14} fill={isMale ? '#bfdbfe' : '#fbcfe8'} />
                  )}
                  {!spouse.avatar_url && (
                    <text x={node.spouseX! + 22} y={node.y + 34} textAnchor="middle" fontSize={12} fill={accentColor} fontWeight={600}>
                      {spouse.name[0]}
                    </text>
                  )}

                  <text x={node.spouseX! + 44} y={node.y + 26} fontSize={14} fontWeight={600} fill="#1e293b">
                    {spouse.name}
                  </text>
                  <text x={node.spouseX! + 44} y={node.y + 44} fontSize={11} fill="#94a3b8">
                    {isMale ? '♂' : '♀'} 配偶
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
