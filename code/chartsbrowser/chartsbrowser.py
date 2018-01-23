# coding:utf8
# author:winton

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String
from xblock.fragment import Fragment


class ChartsBrowswerXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    display_name = String(default=u'图表浏览', scope=Scope.settings)

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        html = self.resource_string("static/html/chartsbrowser.html")
        frag = Fragment(html)
        frag.add_css(self.resource_string("static/css/chartsbrowser.css"))
        frag.add_javascript(self.resource_string("static/js/src/chartsbrowser.js"))
        frag.initialize_js('ChartsBrowswerXBlock')
        return frag

    @XBlock.json_handler
    def getStudentInfo(self, data, suffix=''):
        if not hasattr(self.runtime, 'anonymous_student_id'):
            # 测试环境
            return {
                'username': 'unkown',
                'email': 'luofuwen5935@sina.cn',
                'is_staff': True,
            }
        elif not hasattr(self.runtime, 'get_real_user'):
            # Studio 环境
            return {
                'username': 'unkown',
                'email': 'cannot get email',
                'is_staff': True,
            }
        else:
            student = self.runtime.get_real_user(self.runtime.anonymous_student_id)
            return {
                'username': student.username,
                'email': student.email,
                'is_staff': student.is_staff,
            }

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("ChartsBrowswerXBlock",
             """<chartsbrowser/>
             """),
            ("Multiple ChartsBrowswerXBlock",
             """<vertical_demo>
                <chartsbrowser/>
                <chartsbrowser/>
                <chartsbrowser/>
                </vertical_demo>
             """),
        ]
