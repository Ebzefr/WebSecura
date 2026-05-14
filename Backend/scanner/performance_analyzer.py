import requests
import time
from urllib.parse import urlparse
from typing import Dict, Any, List
import re

class PerformanceAnalyzer:
    """Analyzes website performance metrics"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WebSecura-Performance/1.0'
        })
    
    def analyze_website(self, url: str) -> Dict[str, Any]:
        """
        Perform comprehensive performance analysis
        Returns performance metrics and recommendations
        """
        try:
            results = {
                'overall_score': 0,
                'metrics': {},
                'recommendations': [],
                'status': 'success'
            }
            
            # Load Time Analysis
            load_time_result = self._measure_load_time(url)
            results['metrics']['load_time'] = load_time_result
            
            # Response Size Analysis
            size_result = self._analyze_response_size(url)
            results['metrics']['response_size'] = size_result
            
            # Resource Count Analysis
            resource_result = self._analyze_resources(url)
            results['metrics']['resources'] = resource_result
            
            # Compression Analysis
            compression_result = self._check_compression(url)
            results['metrics']['compression'] = compression_result
            
            # Caching Analysis
            caching_result = self._analyze_caching(url)
            results['metrics']['caching'] = caching_result
            
            # Calculate overall performance score
            results['overall_score'] = self._calculate_performance_score(results['metrics'])
            
            # Generate recommendations
            results['recommendations'] = self._generate_recommendations(results['metrics'])
            
            return results
            
        except Exception as e:
            return {
                'overall_score': 0,
                'error': str(e),
                'status': 'error',
                'metrics': {},
                'recommendations': []
            }
    
    def _measure_load_time(self, url: str) -> Dict[str, Any]:
        """Measure page load time"""
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=30, allow_redirects=True)
            end_time = time.time()
            
            load_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            # Determine status
            if load_time < 1000:
                status = 'excellent'
                score = 100
            elif load_time < 2000:
                status = 'good'
                score = 80
            elif load_time < 3000:
                status = 'fair'
                score = 60
            else:
                status = 'poor'
                score = 40
            
            return {
                'load_time_ms': round(load_time, 2),
                'status': status,
                'score': score,
                'description': f'Page loaded in {round(load_time, 2)}ms'
            }
        except Exception as e:
            return {
                'load_time_ms': 0,
                'status': 'error',
                'score': 0,
                'description': f'Could not measure load time: {str(e)}'
            }
    
    def _analyze_response_size(self, url: str) -> Dict[str, Any]:
        """Analyze response size"""
        try:
            response = self.session.get(url, timeout=30)
            
            # Get content length
            content_length = len(response.content)
            size_kb = content_length / 1024
            
            # Determine status
            if size_kb < 500:
                status = 'excellent'
                score = 100
            elif size_kb < 1000:
                status = 'good'
                score = 80
            elif size_kb < 2000:
                status = 'fair'
                score = 60
            else:
                status = 'poor'
                score = 40
            
            return {
                'size_bytes': content_length,
                'size_kb': round(size_kb, 2),
                'status': status,
                'score': score,
                'description': f'Page size: {round(size_kb, 2)} KB'
            }
        except Exception as e:
            return {
                'size_bytes': 0,
                'size_kb': 0,
                'status': 'error',
                'score': 0,
                'description': f'Could not analyze size: {str(e)}'
            }
    
    def _analyze_resources(self, url: str) -> Dict[str, Any]:
        """Analyze external resources (CSS, JS, images)"""
        try:
            response = self.session.get(url, timeout=30)
            html = response.text
            
            # Count resources
            css_count = len(re.findall(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', html, re.I))
            css_count += len(re.findall(r'<link[^>]*href=["\'][^"\']*\.css["\'][^>]*>', html, re.I))
            
            js_count = len(re.findall(r'<script[^>]*src=["\'][^"\']*["\'][^>]*>', html, re.I))
            
            img_count = len(re.findall(r'<img[^>]*src=["\'][^"\']*["\'][^>]*>', html, re.I))
            
            total_resources = css_count + js_count + img_count
            
            # Determine status
            if total_resources < 20:
                status = 'excellent'
                score = 100
            elif total_resources < 40:
                status = 'good'
                score = 80
            elif total_resources < 60:
                status = 'fair'
                score = 60
            else:
                status = 'poor'
                score = 40
            
            return {
                'css_files': css_count,
                'js_files': js_count,
                'images': img_count,
                'total': total_resources,
                'status': status,
                'score': score,
                'description': f'Total resources: {total_resources} (CSS: {css_count}, JS: {js_count}, Images: {img_count})'
            }
        except Exception as e:
            return {
                'css_files': 0,
                'js_files': 0,
                'images': 0,
                'total': 0,
                'status': 'error',
                'score': 0,
                'description': f'Could not analyze resources: {str(e)}'
            }
    
    def _check_compression(self, url: str) -> Dict[str, Any]:
        """Check if compression is enabled"""
        try:
            response = self.session.get(url, timeout=30)
            
            content_encoding = response.headers.get('Content-Encoding', '').lower()
            
            compression_enabled = content_encoding in ['gzip', 'deflate', 'br', 'brotli']
            
            if compression_enabled:
                status = 'excellent'
                score = 100
                description = f'Compression enabled ({content_encoding})'
            else:
                status = 'poor'
                score = 0
                description = 'No compression detected'
            
            return {
                'enabled': compression_enabled,
                'type': content_encoding if compression_enabled else 'none',
                'status': status,
                'score': score,
                'description': description
            }
        except Exception as e:
            return {
                'enabled': False,
                'type': 'unknown',
                'status': 'error',
                'score': 0,
                'description': f'Could not check compression: {str(e)}'
            }
    
    def _analyze_caching(self, url: str) -> Dict[str, Any]:
        """Analyze caching headers"""
        try:
            response = self.session.get(url, timeout=30)
            
            cache_control = response.headers.get('Cache-Control', '')
            expires = response.headers.get('Expires', '')
            etag = response.headers.get('ETag', '')
            last_modified = response.headers.get('Last-Modified', '')
            
            has_caching = bool(cache_control or expires or etag or last_modified)
            
            caching_headers = []
            if cache_control:
                caching_headers.append(f'Cache-Control: {cache_control}')
            if expires:
                caching_headers.append(f'Expires: {expires}')
            if etag:
                caching_headers.append('ETag present')
            if last_modified:
                caching_headers.append('Last-Modified present')
            
            if has_caching:
                if cache_control and 'max-age' in cache_control.lower():
                    status = 'excellent'
                    score = 100
                else:
                    status = 'good'
                    score = 80
                description = 'Caching headers configured'
            else:
                status = 'poor'
                score = 0
                description = 'No caching headers found'
            
            return {
                'enabled': has_caching,
                'headers': caching_headers,
                'status': status,
                'score': score,
                'description': description
            }
        except Exception as e:
            return {
                'enabled': False,
                'headers': [],
                'status': 'error',
                'score': 0,
                'description': f'Could not analyze caching: {str(e)}'
            }
    
    def _calculate_performance_score(self, metrics: Dict[str, Any]) -> int:
        """Calculate overall performance score from all metrics"""
        try:
            scores = []
            weights = {
                'load_time': 0.35,      # 35% weight
                'response_size': 0.20,  # 20% weight
                'resources': 0.15,      # 15% weight
                'compression': 0.15,    # 15% weight
                'caching': 0.15         # 15% weight
            }
            
            for metric_name, weight in weights.items():
                if metric_name in metrics and 'score' in metrics[metric_name]:
                    scores.append(metrics[metric_name]['score'] * weight)
            
            overall_score = sum(scores)
            return int(overall_score)
        except:
            return 0
    
    def _generate_recommendations(self, metrics: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate performance recommendations based on metrics"""
        recommendations = []
        
        try:
            # Load Time Recommendations
            if 'load_time' in metrics:
                load_time = metrics['load_time']
                if load_time.get('score', 0) < 80:
                    recommendations.append({
                        'category': 'Load Time',
                        'issue': f"Page load time is {load_time.get('load_time_ms', 0)}ms",
                        'recommendation': 'Optimize server response time, minimize redirects, and leverage browser caching',
                        'priority': 'high' if load_time.get('score', 0) < 60 else 'medium'
                    })
            
            # Response Size Recommendations
            if 'response_size' in metrics:
                size = metrics['response_size']
                if size.get('score', 0) < 80:
                    recommendations.append({
                        'category': 'Page Size',
                        'issue': f"Page size is {size.get('size_kb', 0)} KB",
                        'recommendation': 'Minify CSS and JavaScript, optimize images, and remove unused code',
                        'priority': 'high' if size.get('score', 0) < 60 else 'medium'
                    })
            
            # Compression Recommendations
            if 'compression' in metrics:
                compression = metrics['compression']
                if not compression.get('enabled', False):
                    recommendations.append({
                        'category': 'Compression',
                        'issue': 'Text compression is not enabled',
                        'recommendation': 'Enable Gzip or Brotli compression on your web server to reduce transfer sizes',
                        'priority': 'high'
                    })
            
            # Caching Recommendations
            if 'caching' in metrics:
                caching = metrics['caching']
                if not caching.get('enabled', False):
                    recommendations.append({
                        'category': 'Caching',
                        'issue': 'Browser caching is not configured',
                        'recommendation': 'Set Cache-Control headers to leverage browser caching for static resources',
                        'priority': 'high'
                    })
            
            # Resource Recommendations
            if 'resources' in metrics:
                resources = metrics['resources']
                if resources.get('score', 0) < 80:
                    recommendations.append({
                        'category': 'Resources',
                        'issue': f"High number of resources ({resources.get('total', 0)})",
                        'recommendation': 'Combine CSS/JS files, use CSS sprites for images, and implement lazy loading',
                        'priority': 'medium'
                    })
            
            return recommendations
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return recommendations